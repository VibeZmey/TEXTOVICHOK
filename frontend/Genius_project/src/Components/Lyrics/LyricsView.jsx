import { useMemo, useRef, useState, useEffect } from "react";
import styles from "./LyricsView.module.css";
import { Link, useLocation, useNavigate } from "react-router-dom";
import axiosInstance from "../../api/axiosInstance";
import { ENDPOINTS } from "../../api/endpoints";
import SearchBar from "../SearchBar/SearchBar.jsx";
import { useAuth } from "../../context/AuthContext";
import { CURRENT_USER_ID } from "../../data/mockData";


const LYRICS_ID = "00000000-0000-0000-0000-000000000001";
const LS_KEY = `mock_annotations_${LYRICS_ID}`;

const demoLyrics = `I walk this road alone tonight
The city lights are shining bright
But every step reminds me why
Some dreams just slowly pass us by

My tea's gone cold, I'm wonderin' why I
Got out of bed at all
The morning rain clouds up my window
And I can't see at all
And even if I could, it'd all be grey
But your picture on my wall
It reminds me that it's not so bad, it's not so bad

My tea's gone cold, I'm wonderin' why I
Got out of bed at all
The morning rain clouds up my window
And I can't see at all
And even if I could, it'd all be grey
But your picture on my wall
It reminds me that it's not so bad, it's not so bad

My tea's gone cold, I'm wonderin' why I
Got out of bed at all
The morning rain clouds up my window
And I can't see at all
And even if I could, it'd all be grey
But your picture on my wall
It reminds me that it's not so bad, it's not so bad
`;

const LyricsView = () => {
    const { isAuthenticated, user } = useAuth();
    const containerRef = useRef(null);
    const navigate = useNavigate();
    const location = useLocation();

    const [annotations, setAnnotations] = useState([]);
    const [activeOffset, setActiveOffset] = useState(null);
    const [selectionState, setSelectionState] = useState(null);

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [newAnnotationText, setNewAnnotationText] = useState("");
    const [loadingAnnotations, setLoadingAnnotations] = useState(false);

    const lyricsText = useMemo(() => demoLyrics.replace(/\r\n/g, "\n"), []);


    // ===== ЗАГРУЗКА АННОТАЦИЙ =====
    useEffect(() => {
        const loadAnnotations = async () => {
            setLoadingAnnotations(true);
            try {
                const res = await axiosInstance.get(ENDPOINTS.LYRICS.ANNOTATIONS(LYRICS_ID));
                const serverData = Array.isArray(res.data) ? res.data : [];
                setAnnotations(serverData);
                localStorage.setItem(LS_KEY, JSON.stringify(serverData));
                return;
            } catch {}
            finally {
                setLoadingAnnotations(false);
            }

            try {
                const raw = localStorage.getItem(LS_KEY);
                const parsed = raw ? JSON.parse(raw) : [];
                setAnnotations(Array.isArray(parsed) ? parsed : []);
            } catch {
                setAnnotations([]);
            }
        };

        loadAnnotations();
    }, []);


    // ===== НОРМАЛИЗАЦИЯ АННОТАЦИЙ =====
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

    // ===== ВСПОМОГАТЕЛЬНАЯ ФУНКЦИЯ =====
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

    // ===== АКТИВНЫЕ АННОТАЦИИ =====
    const activeAnnotations = useMemo(() => {
        if (activeOffset == null) return [];
        const list = normalizedAnnotations.filter(
            (a) => a.from <= activeOffset && activeOffset < a.to
        );
        const unique = new Map();
        for (const a of list) unique.set(a.id, a);
        return [...unique.values()];
    }, [normalizedAnnotations, activeOffset]);

    // ===== ДИАПАЗОН АКТИВНОЙ ГРУППЫ =====
    const activeGroupRange = useMemo(() => {
        if (!activeAnnotations.length) return null;
        const from = Math.min(...activeAnnotations.map((a) => a.from));
        const to = Math.max(...activeAnnotations.map((a) => a.to));
        return { from, to };
    }, [activeAnnotations]);

    // ===== СЕГМЕНТЫ ТЕКСТА =====
    const segments = useMemo(() => {
        const points = new Set([0, lyricsText.length]);
        normalizedAnnotations.forEach((a) => {
            points.add(a.from);
            points.add(a.to);
        });

        const sorted = [...points].sort((a, b) => a - b);
        const result = [];

        for (let i = 0; i < sorted.length - 1; i++) {
            const from = sorted[i];
            const to = sorted[i + 1];
            if (to <= from) continue;

            const hasAnyAnnotation = normalizedAnnotations.some((a) => a.from < to && a.to > from);

            result.push({
                from,
                to,
                text: lyricsText.slice(from, to),
                isAnnotated: hasAnyAnnotation,
            });
        }

        return result;
    }, [lyricsText, normalizedAnnotations]);

    // ===== ОБРАБОТКА ВЫДЕЛЕНИЯ ТЕКСТА =====
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
        if (!selectionState) return;

        if (!isAuthenticated) {
            setIsCreateModalOpen(false);
            navigate("/login", {
                state: {
                    from: location.pathname,
                    selectionState,
                    lyricsId: LYRICS_ID
                }
            });
            return;
        }

        const text = newAnnotationText.trim();
        if (!text) return;

        const payload = {
            lyricsId: LYRICS_ID,
            userId: user?.id,
            from: selectionState.from,
            to: selectionState.to,
            text,
            status: "pending",
            isVerified: false
        };

        const optimistic = {
            id: `local-${Date.now()}`,
            ...payload,
            createdAt: new Date().toISOString(),
        };

        try {
            const res = await axiosInstance.post(ENDPOINTS.ANNOTATIONS.CREATE, payload);
            const saved = res?.data || optimistic;

            setAnnotations((prev) => {
                const updated = [...prev, saved].sort((a, b) => a.from - b.from);
                localStorage.setItem(LS_KEY, JSON.stringify(updated));
                return updated;
            });

            setActiveOffset(Math.floor((saved.from + saved.to) / 2));
        } catch {
            setAnnotations((prev) => {
                const updated = [...prev, optimistic].sort((a, b) => a.from - b.from);
                localStorage.setItem(LS_KEY, JSON.stringify(updated));
                return updated;
            });

            setActiveOffset(Math.floor((optimistic.from + optimistic.to) / 2));
        } finally {
            setSelectionState(null);
            setIsCreateModalOpen(false);
            setNewAnnotationText("");
            window.getSelection()?.removeAllRanges();
        }
    };

    return (
        <div className={styles.page}>
            {/* NAVBAR */}
            <div className={styles.navbar}>
                <Link to="/home" className={styles.navLeft}>Home</Link>
                <SearchBar
                    placeholder="Search lyrics or artists"
                    onSearch={(query) => console.log(query)}
                />
                <Link to="/profile" className={styles.navRight}>Profile</Link>
            </div>

            {/* HERO SECTION - TRACK INFO (CENTERED) */}
            <div className={styles.trackHero}>
                <div className={styles.heroContent}>
                    <div className={styles.trackCoverLarge}>
                        <div className={styles.coverPlaceholder}>
                            <span className={styles.coverIcon}>🎵</span>
                        </div>
                        <div className={styles.coverGlow} />
                    </div>
                    <div className={styles.trackHeroInfo}>
                        <h1 className={styles.trackTitle}>Track Title</h1>
                        <div className={styles.trackMeta}>
                            <span className={styles.artistName}>Artist</span>
                            <span className={styles.metaDivider}>•</span>
                            <span className={styles.albumName}>Album</span>
                            <span className={styles.metaDivider}>•</span>
                            <span className={styles.releaseYear}>2024</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* MAIN CONTENT */}
            <div className={styles.contentWrapper}>
                {/* SECTION TITLE */}
                <div className={styles.sectionHeader}>
                    <h2 className={styles.sectionTitle}>Lyrics</h2>
                </div>

                {/* TWO COLUMNS */}
                <div className={styles.columnsGrid}>
                    {/* LEFT COLUMN - LYRICS */}
                    <div className={styles.column}>
                        <div className={styles.lyricsCard}>
                            <div
                                ref={containerRef}
                                className={styles.lyricsContent}
                                onMouseUp={handleMouseUp}
                            >
                                {segments.map((seg, idx) => {
                                    if (!seg.isAnnotated) {
                                        return (
                                            <span
                                                key={`p-${idx}`}
                                                data-start={seg.from}
                                                data-end={seg.to}
                                            >
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
                                            className={`${styles.annotated} ${
                                                isInActiveGroup ? styles.annotatedActive : ""
                                            }`}
                                            onClick={() =>
                                                setActiveOffset(Math.floor((seg.from + seg.to) / 2))
                                            }
                                        >
                                            {seg.text}
                                        </span>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* RIGHT COLUMN - ANNOTATIONS SIDEBAR */}
                    <div className={styles.sidebar}>
                        <div className={styles.sidebarCard}>
                            <h3 className={styles.sidebarTitle}>
                                {activeAnnotations.length > 0
                                    ? `Annotations (${activeAnnotations.length})`
                                    : "Annotations"}
                            </h3>

                            {activeAnnotations.length > 0 ? (
                                <div className={styles.annotationsList}>
                                    {activeAnnotations.map((ann) => (
                                        <div
                                            key={ann.id}
                                            className={styles.annotationCard}
                                        >
                                            <div className={styles.annotationQuote}>
                                                "{lyricsText.slice(ann.from, ann.to)}"
                                            </div>
                                            <p className={styles.annotationText}>{ann.text}</p>
                                            <div className={styles.annotationMeta}>
                                                <span className={styles.annotationAuthor}>
                                                    {ann.userId === user?.id ? "You" : "User"}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className={styles.annotationPlaceholder}>
                                    <span className={styles.placeholderIcon}>💬</span>
                                    <p>Click on highlighted text to view or add annotations</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* FLOATING ADD BUTTON */}
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

            {/* CREATE MODAL */}
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