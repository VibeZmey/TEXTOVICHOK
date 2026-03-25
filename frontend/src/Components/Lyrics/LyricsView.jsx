import { useMemo, useRef, useState, useEffect } from "react";
import styles from "./LyricsView.module.css";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import SearchBar from "../SearchBar/SearchBar.jsx";
import { useAuth } from "../../context/AuthContext";
import {lyricsService, annotationService, albumService, userService} from "../../api/apiService";
import Navbar from "../NavBar/NavBar.jsx";


const CDN_BASE = "http://localhost:9000";

const LyricsView = () => {
    const { id: lyricsId } = useParams();
    const { isAuthenticated, user } = useAuth();
    const containerRef = useRef(null);
    const navigate = useNavigate();
    const location = useLocation();

    const preloadedTrack = location.state?.track || null;
    const preloadedAlbum = location.state?.album || null;

    const [artist, setArtist] = useState(null);
    const [track, setTrack] = useState(preloadedTrack);
    const [album, setAlbum] = useState(preloadedAlbum);
    const [annotations, setAnnotations] = useState([]);

    const [activeOffset, setActiveOffset] = useState(null);
    const [selectionState, setSelectionState] = useState(null);

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [newAnnotationText, setNewAnnotationText] = useState("");

    const [loadingAnnotations, setLoadingAnnotations] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!preloadedTrack) {
            // На случай прямого входа по URL без state
            setError("Song data was not passed. Open song from album page.");
        }
    }, [preloadedTrack]);

    // ===== ЗАГРУЗКА АННОТАЦИЙ =====
    useEffect(() => {
        if (!lyricsId) return;

        const loadAnnotations = async () => {
            setLoadingAnnotations(true);
            try {
                const res = await lyricsService.getAnnotations(lyricsId);
                const serverData = Array.isArray(res.data) ? res.data : [];
                setAnnotations(serverData);
                
            } catch (err) {
                console.error("Failed to load annotations:", err?.response?.data || err);
                setAnnotations([]);
            } finally {
                setLoadingAnnotations(false);
            }
        };

        loadAnnotations();
    }, [lyricsId]);

    const lyricsText = useMemo(() => {
        const text = track?.text || "";
        return text.replace(/\r\n/g, "\n");
    }, [track?.text]);

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

    const submitAnnotation = async (e) => {
        e.preventDefault();
        if (!selectionState || !lyricsId) return;

        if (!isAuthenticated) {
            setIsCreateModalOpen(false);
            navigate("/login", {
                state: {
                    from: location.pathname,
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
                setAnnotations((prev) => [...prev, saved].sort((a, b) => a.from - b.from));
                setActiveOffset(Math.floor((saved.from + saved.to) / 2));
            } else {
                const refreshed = await lyricsService.getAnnotations(lyricsId);
                setAnnotations(Array.isArray(refreshed.data) ? refreshed.data : []);
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

    const trackTitle = track?.name || track?.title || "Track Title";
    const artistName = album?.artist || "Artist";
    const albumName = album?.name || "Album";
    const releaseYear = album?.year || track?.year || "N/A";

    return (
        <div className={styles.page}>
            <Navbar/>

            <div className={styles.trackHero}>
                <div className={styles.heroContent}>
                    <div className={styles.trackCoverLarge}>
                        <div className={styles.coverPlaceholder}>
                        {album.imageUrl ? (
                                        <img
                                            src={`${CDN_BASE}/${album.imageUrl}`}
                                            alt={album.name}
                                            className={styles.albumCover}
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
                            <span className={styles.artistName}>{artistName}</span>
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
                    <div className={styles.column}>
                        <div className={styles.lyricsCard}>
                            {error ? (
                                <div className={styles.emptyState}>{error}</div>
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

                    <div className={styles.sidebar}>
                        <div className={styles.sidebarCard}>
                            <h3 className={styles.sidebarTitle}>
                                {activeAnnotations.length > 0 ? `Annotations (${activeAnnotations.length})` : "Annotations"}
                            </h3>

                            {loadingAnnotations ? (
                                <div className={styles.annotationPlaceholder}>
                                    <p>Loading annotations...</p>
                                </div>
                            ) : activeAnnotations.length > 0 ? (
                                <div className={styles.annotationsList}>
                                    {activeAnnotations.map((ann) => (
                                        <div key={ann.id} className={styles.annotationCard}>
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
                                    <p>Click highlighted text to view or add annotations</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

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
                                <button type="button" className={styles.btnGhost} onClick={() => setIsCreateModalOpen(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className={styles.btnPrimary} disabled={!newAnnotationText.trim()}>
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