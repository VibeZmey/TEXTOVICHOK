// src/pages/LyricsView/LyricsView.jsx
import { useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import styles from "./LyricsView.module.css";

// Компоненты
import Navbar from "../Components/NavBar/NavBar.jsx";

// Хуки и сервисы
import { useAuth } from "../context/AuthContext.jsx";
import {
    useLyrics,
    useLyricsAnnotations,
    useAlbum,
    useUser,
} from "../hooks/index.js";
import { annotationService } from "../api/apiService.js";

const CDN_BASE = "http://localhost:9000";

const LyricsView = () => {
    const { id: lyricsId } = useParams();
    const { isAuthenticated, user } = useAuth();
    const containerRef = useRef(null);
    const navigate = useNavigate();

    // 🔥 React Query: загрузка данных
    const { lyrics: track, isLoading: trackLoading, isError: trackError } = useLyrics(lyricsId);
    const {
        annotations,
        isLoading: annotationsLoading,
        invalidate: invalidateAnnotations
    } = useLyricsAnnotations(lyricsId);

    // Загружаем альбом и артиста (если есть track.userId или track.albumId)
    const { album } = useAlbum(track?.albumId);
    const { user: artist } = useUser(album?.userId);

    // 🔥 Сводные состояния
    const isLoading = trackLoading || annotationsLoading;

    // ===== СОХРАНЕННАЯ ЛОГИКА: Выделение текста и модальные окна =====
    const [activeOffset, setActiveOffset] = useState(null);
    const [selectionState, setSelectionState] = useState(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [newAnnotationText, setNewAnnotationText] = useState("");

    const lyricsText = useMemo(() => {
        const text = track?.text || "";
        return text.replace(/\r\n/g, "\n");
    }, [track?.text]);

    // Нормализация аннотаций
    const normalizedAnnotations = useMemo(() => {
        return (annotations || [])
            .map((a) => ({ ...a, from: Number(a.from), to: Number(a.to) }))
            .filter(
                (a) =>
                    Number.isFinite(a.from) &&
                    Number.isFinite(a.to) &&
                    a.from >= 0 &&
                    a.to > a.from &&
                    a.to <= lyricsText.length
            )
            .sort((a, b) => a.from - b.from || String(a.id).localeCompare(String(b.id)));
    }, [annotations, lyricsText.length]);

    // Вспомогательные функции
    const getGlobalOffset = (node, nodeOffset) => {
        let el = node?.nodeType === Node.TEXT_NODE ? node.parentElement : node;
        while (el && el !== containerRef.current && !el.dataset?.start) el = el.parentElement;
        if (!el || el === containerRef.current) return null;
        const segStart = Number(el.dataset.start);
        const segEnd = Number(el.dataset.end);
        if (!Number.isFinite(segStart) || !Number.isFinite(segEnd)) return null;
        const global = segStart + nodeOffset;
        return Math.min(Math.max(global, segStart), segEnd);
    };

    const activeAnnotations = useMemo(() => {
        if (activeOffset == null) return [];
        const list = normalizedAnnotations.filter((a) => a.from <= activeOffset && activeOffset < a.to);
        const unique = new Map();
        for (const a of list) unique.set(a.id, a);
        return [...unique.values()];
    }, [normalizedAnnotations, activeOffset]);

    const activeGroupRange = useMemo(() => {
        if (!activeAnnotations.length) return null;
        const from = Math.min(...activeAnnotations.map((a) => a.from));
        const to = Math.max(...activeAnnotations.map((a) => a.to));
        return { from, to };
    }, [activeAnnotations]);

    const segments = useMemo(() => {
        const activeNormalizedAnnotations = normalizedAnnotations.filter((a) => !a.isRejected);

        const points = new Set([0, lyricsText.length]);
        activeNormalizedAnnotations.forEach((a) => {
            points.add(a.from);
            points.add(a.to);
        });

        const sorted = [...points].sort((a, b) => a - b);
        const result = [];

        for (let i = 0; i < sorted.length - 1; i++) {
            const from = sorted[i];
            const to = sorted[i + 1];
            if (to <= from) continue;

            const hasAnyAnnotation = activeNormalizedAnnotations.some((a) => a.from < to && a.to > from);
            result.push({
                from,
                to,
                text: lyricsText.slice(from, to),
                isAnnotated: hasAnyAnnotation,
            });
        }

        return result;
    }, [lyricsText, normalizedAnnotations]); // Зависимости оставляем те же

    const handleMouseUp = () => {
        const sel = window.getSelection();
        if (!sel || sel.rangeCount === 0 || sel.isCollapsed) {
            setSelectionState(null);
            return;
        }
        const range = sel.getRangeAt(0);
        if (!containerRef.current?.contains(range.commonAncestorContainer)) {
            setSelectionState(null);
            return;
        }
        const start = getGlobalOffset(range.startContainer, range.startOffset);
        const end = getGlobalOffset(range.endContainer, range.endOffset);
        if (start == null || end == null || start === end) {
            setSelectionState(null);
            return;
        }
        const from = Math.min(start, end);
        const to = Math.max(start, end);
        const selectedText = lyricsText.slice(from, to);
        if (!selectedText.trim()) {
            setSelectionState(null);
            return;
        }
        const rect = range.getBoundingClientRect();
        setSelectionState({
            from,
            to,
            selectedText,
            x: rect.left + rect.width / 2 + window.scrollX,
            y: rect.top + window.scrollY - 8,
        });
    };

    // ===== СОЗДАНИЕ АННОТАЦИИ =====
    const submitAnnotation = async (e) => {
        e.preventDefault();
        if (!selectionState || !lyricsId) return;

        if (!isAuthenticated) {
            setIsCreateModalOpen(false);
            navigate("/login", {
                state: {
                    from: window.location.pathname,
                    selectionState,
                    lyricsId,
                },
            });
            return;
        }

        const text = newAnnotationText.trim();
        if (!text) return;

        const payload = {
            lyricsId,
            userId: user?.id,
            from: selectionState.from,
            to: selectionState.to,
            text,
        };

        try {
            const res = await annotationService.create(payload);
            const saved = res?.data;

            if (saved) {
                invalidateAnnotations();
                setActiveOffset(Math.floor((saved.from + saved.to) / 2));
            }
        } catch (err) {
            console.error("Failed to save annotation:", err?.response?.data || err);
            alert("Failed to save annotation");
        } finally {
            setSelectionState(null);
            setIsCreateModalOpen(false);
            setNewAnnotationText("");
            window.getSelection()?.removeAllRanges();
        }
    };

    // ===== ОТОБРАЖЕНИЕ: Нормализация данных для UI =====
    const trackTitle = track?.name || track?.title || "Track Title";
    const artistName = artist?.login || album?.artistName || "Unknown Artist";
    const albumName = album?.name || "Unknown Album";
    const releaseYear = album?.year || track?.year || "N/A";

    // Обработка ошибки загрузки
    if (trackError) {
        return (
            <div className={styles.errorPage}>
                <Navbar />
                <div className={styles.errorContent}>
                    <h2>Failed to load lyrics</h2>
                    <p>Please try again later</p>
                    <button onClick={() => navigate(-1)}>Go Back</button>
                </div>
            </div>
        );
    }

    // ===== ФИЛЬТРАЦИЯ АННОТАЦИЙ ПО СТАТУСУ =====
    const visibleAnnotations = useMemo(() => {
        return (activeAnnotations || [])
            .filter((ann) => !ann.isRejected);
    }, [activeAnnotations]);

    return (
        <div className={styles.page}>
            <Navbar />

            {/* TRACK HERO */}
            <div className={styles.trackHero}>
                <div className={styles.heroContent}>
                    <div className={styles.trackCoverLarge}>
                        <div className={styles.coverPlaceholder}>
                            {album?.imageUrl ? (
                                <img
                                    src={`${CDN_BASE}/${album.imageUrl}`}
                                    alt={albumName}
                                    className={styles.albumCover}
                                    loading="lazy"
                                />
                            ) : (
                                <div className={styles.albumCoverPlaceholder} />
                            )}
                        </div>
                        <div className={styles.coverGlow} />
                    </div>
                    <div className={styles.trackHeroInfo}>
                        <h1 className={styles.trackTitle}>{trackTitle}</h1>
                        <div className={styles.trackMeta}>
                            <span className={styles.artistName}>
                                {trackLoading || annotationsLoading ? "Loading..." : artistName}
                            </span>
                            <span className={styles.metaDivider}>•</span>
                            <span className={styles.albumName}>{albumName}</span>
                            <span className={styles.metaDivider}>•</span>
                            <span className={styles.releaseYear}>{releaseYear}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className={styles.contentWrapper}>
                <div className={styles.sectionHeader}>
                    <h2 className={styles.sectionTitle}>Lyrics</h2>
                </div>

                <div className={styles.columnsGrid}>
                    {/* LYRICS COLUMN */}
                    <div className={styles.column}>
                        <div className={styles.lyricsCard}>
                            {isLoading ? (
                                <div className={styles.emptyState}>Loading lyrics...</div>
                            ) : !lyricsText ? (
                                <div className={styles.emptyState}>No lyrics text</div>
                            ) : (
                                <div ref={containerRef} className={styles.lyricsContent} onMouseUp={handleMouseUp}>
                                    {segments.map((seg, idx) => {
                                        if (!seg.isAnnotated) {
                                            return (
                                                <span key={`p-${idx}`} data-start={seg.from} data-end={seg.to}>
                                                    {seg.text}
                                                </span>
                                            );
                                        }
                                        const isInActiveGroup =
                                            activeGroupRange &&
                                            seg.from < activeGroupRange.to &&
                                            seg.to > activeGroupRange.from;
                                        return (
                                            <span
                                                key={`a-${idx}`}
                                                data-start={seg.from}
                                                data-end={seg.to}
                                                className={`${styles.annotated} ${isInActiveGroup ? styles.annotatedActive : ""}`}
                                                onClick={() => setActiveOffset(Math.floor((seg.from + seg.to) / 2))}
                                            >
                                                {seg.text}
                                            </span>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* SIDEBAR: ANNOTATIONS */}
                    <div className={styles.sidebar}>
                        <div className={styles.sidebarCard}>
                            <h3 className={styles.sidebarTitle}>
                                {visibleAnnotations.length > 0 ? `Annotations (${visibleAnnotations.length})` : "Annotations"}
                            </h3>

                            {annotationsLoading ? (
                                <div className={styles.annotationPlaceholder}>
                                    <p>Loading annotations...</p>
                                </div>
                            ) : visibleAnnotations.length > 0 ? (
                                <div className={styles.annotationsList}>
                                    {visibleAnnotations.map((ann) => {
                                        // Определяем, показывать ли бейдж "Непроверенная"
                                        const isPending = !ann.isVerified; // Если не verified и не rejected → pending
                                        const cardClass = isPending ? styles.pending : styles.approved;

                                        return (
                                            <div
                                                key={ann.id}
                                                className={`${styles.annotationCard} ${cardClass}`}
                                            >
                                                <div className={styles.annotationHeader}>
                                                    <div className={styles.annotationQuote}>
                                                        "{lyricsText.slice(ann.from, ann.to)}"
                                                    </div>

                                                    {/* ← Показываем бейдж только для непроверенных */}
                                                    {isPending && (
                                                        <span className={`${styles.statusBadge} ${styles.pending}`}>
                                Непроверенная
                            </span>
                                                    )}
                                                </div>
                                                <p className={styles.annotationText}>{ann.text}</p>
                                                <div className={styles.annotationMeta}>
                        <span className={styles.annotationAuthor}>
                            {ann.userId === user?.id ? "You" : "User"}
                        </span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className={styles.annotationPlaceholder}>
                                    <span className={styles.placeholderIcon}>💬</span>
                                    <p>Click highlighted text to view or add annotations</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* ===== КНОПКА ДОБАВЛЕНИЯ АННОТАЦИИ ===== */}
            {selectionState && (
                <button
                    className={styles.addBtn}
                    style={{ top: selectionState.y, left: selectionState.x }}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                        setNewAnnotationText("");
                        setIsCreateModalOpen(true);
                    }}
                >
                    <span className={styles.addBtnIcon}>✎</span>
                    Add annotation
                </button>
            )}

            {/* ===== МОДАЛКА СОЗДАНИЯ АННОТАЦИИ ===== */}
            {isCreateModalOpen && (
                <div className={styles.modalOverlay} onClick={() => setIsCreateModalOpen(false)}>
                    <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                        <h3 className={styles.modalTitle}>Add Annotation</h3>
                        <div className={styles.selectedPreview}>
                            <span className={styles.previewLabel}>Selected text:</span>
                            <p className={styles.selectedText}>{selectionState?.selectedText}</p>
                        </div>

                        <form onSubmit={submitAnnotation}>
                            <textarea
                                className={styles.textarea}
                                placeholder="Write your annotation..."
                                value={newAnnotationText}
                                onChange={(e) => setNewAnnotationText(e.target.value)}
                                rows={5}
                            />
                            <div className={styles.modalActions}>
                                <button
                                    type="button"
                                    className={styles.btnGhost}
                                    onClick={() => setIsCreateModalOpen(false)}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className={styles.btnPrimary}
                                    disabled={!newAnnotationText.trim()}
                                >
                                    Save Annotation
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LyricsView;