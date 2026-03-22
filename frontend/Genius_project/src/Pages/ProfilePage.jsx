import { useNavigate } from "react-router-dom";
import { useState, useMemo, useEffect } from "react";
import styles from "./Profile.module.css";
import SearchBar from "../components/SearchBar/SearchBar";
import { getCurrentUser, CURRENT_USER_ID } from "../data/mockData";

const STORAGE_KEY = "mock_user_albums";
const emptyAlbum = { name: "", artist: "", coverImage: "", description: "" };
const emptySong = { name: "", year: "", description: "", text: "" };

const ProfilePage = () => {
    const navigate = useNavigate();
    const mockUser = getCurrentUser();

    const [albums, setAlbums] = useState(() => {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            return raw ? JSON.parse(raw) : [];
        } catch {
            return [];
        }
    });

    // User's annotations state
    const [userAnnotations, setUserAnnotations] = useState([]);
    const [loadingAnnotations, setLoadingAnnotations] = useState(true);
    const [showAllAnnotations, setShowAllAnnotations] = useState(false); // ← Состояние для кнопки Show all

    // ----- MODALS -----
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [createStep, setCreateStep] = useState('album');

    // Create flow state
    const [albumDraft, setAlbumDraft] = useState(emptyAlbum);
    const [songDraft, setSongDraft] = useState(emptySong);
    const [songsDraft, setSongsDraft] = useState([]);

    // Edit flow state
    const [editAlbumId, setEditAlbumId] = useState(null);
    const [editAlbumDraft, setEditAlbumDraft] = useState(emptyAlbum);
    const [editSongsDraft, setEditSongsDraft] = useState([]);
    const [editSongForm, setEditSongForm] = useState(emptySong);
    const [isAddingSong, setIsAddingSong] = useState(false);

    const [deleteAnnotationId, setDeleteAnnotationId] = useState(null);

    // ===== DELETE ANNOTATION =====
    const confirmDeleteAnnotation = (annotationId) => {
        setDeleteAnnotationId(annotationId);
        setIsDeleteConfirmOpen(true);
    };

    const executeDeleteAnnotation = () => {
        if (!deleteAnnotationId) return;
        // Удаляем из всех ключей аннотаций в localStorage
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key?.startsWith("mock_annotations_")) {
                try {
                    const raw = localStorage.getItem(key);
                    const annotations = raw ? JSON.parse(raw) : [];
                    const filtered = annotations.filter((a) => a.id !== deleteAnnotationId);
                    localStorage.setItem(key, JSON.stringify(filtered));
                } catch {}
            }
        }
        setUserAnnotations((prev) => prev.filter((a) => a.id !== deleteAnnotationId));
        closeAllModals();
    };

    const canContinueAlbum = useMemo(() => albumDraft.name.trim().length > 0, [albumDraft.name]);
    const canAddSong = useMemo(
        () => songDraft.name.trim() && songDraft.text.trim(),
        [songDraft]
    );
    const canSaveEditSong = useMemo(
        () => editSongForm.name.trim() && editSongForm.year && editSongForm.text.trim(),
        [editSongForm]
    );

    // ===== ЗАГРУЗКА АННОТАЦИЙ ПОЛЬЗОВАТЕЛЯ =====
    useEffect(() => {
        const loadUserAnnotations = () => {
            setLoadingAnnotations(true);
            try {
                const allAnnotations = [];

                for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    if (key?.startsWith("mock_annotations_")) {
                        const raw = localStorage.getItem(key);
                        const annotations = raw ? JSON.parse(raw) : [];
                        if (Array.isArray(annotations)) {
                            allAnnotations.push(...annotations);
                        }
                    }
                }

                const userAnns = allAnnotations.filter(
                    (ann) => ann.userId === CURRENT_USER_ID
                );

                const annotationsWithLyrics = userAnns.map((ann) => {
                    let foundSong = null;
                    let foundAlbum = null;

                    for (const album of albums) {
                        const song = album.songs?.find((s) => {
                            return s.text && ann.text && s.text.includes(ann.text.slice(0, 50));
                        });
                        if (song) {
                            foundSong = song;
                            foundAlbum = album;
                            break;
                        }
                    }

                    return {
                        ...ann,
                        songName: foundSong?.name || "Unknown Song",
                        albumName: foundAlbum?.name || "Unknown Album",
                        albumId: foundAlbum?.id || null,
                        lyricSnippet: ann.text?.slice(0, 100) + (ann.text?.length > 100 ? "..." : ""),
                        status: ann.isVerified === true
                            ? "approved"
                            : (ann.status || "pending"),
                        createdAt: ann.createdAt || new Date().toISOString(),
                    };
                });

                setUserAnnotations(annotationsWithLyrics);
            } catch (error) {
                console.error("Failed to load annotations:", error);
                setUserAnnotations([]);
            } finally {
                setLoadingAnnotations(false);
            }
        };
        loadUserAnnotations();

        const handleStorageChange = (e) => {
            if (e.key?.startsWith("mock_annotations_") || e.type === "storage-sync") {
                loadUserAnnotations();
            }
        };
        window.addEventListener("storage", handleStorageChange);
        window.addEventListener("storage-sync", handleStorageChange);

        return () => {
            window.removeEventListener("storage", handleStorageChange);
            window.removeEventListener("storage-sync", handleStorageChange);
        };
    }, [albums]);

    const handleAlbumCover = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (evt) => {
            setAlbumDraft((p) => ({ ...p, coverImage: evt.target.result }));
        };
        reader.readAsDataURL(file);
    };

    const handleEditAlbumCover = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (evt) => {
            setEditAlbumDraft((p) => ({ ...p, coverImage: evt.target.result }));
        };
        reader.readAsDataURL(file);
    };

    const persistAlbums = (next) => {
        setAlbums(next);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    };

    // ===== CREATE FLOW =====
    const openCreateFlow = () => {
        setAlbumDraft(emptyAlbum);
        setSongDraft(emptySong);
        setSongsDraft([]);
        setCreateStep('album');
        setIsCreateModalOpen(true);
    };

    const closeAllModals = () => {
        setIsCreateModalOpen(false);
        setCreateStep('album');
        setIsEditModalOpen(false);
        setIsDeleteConfirmOpen(false);
        setDeleteTarget(null);
        setEditAlbumId(null);
        setEditAlbumDraft(emptyAlbum);
        setEditSongsDraft([]);
        setEditSongForm(emptySong);
        setIsAddingSong(false);
    };

    const goToSongStep = () => {
        if (!canContinueAlbum) return;
        setCreateStep('songs');
    };

    const addSongToDraft = () => {
        if (!canAddSong) return;
        const newSong = {
            id: `song-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            ...songDraft,
            year: Number(songDraft.year),
        };
        setSongsDraft((prev) => [...prev, newSong]);
        setSongDraft(emptySong);
    };

    const finishCreateAlbum = () => {
        let finalSongs = [...songsDraft];
        if (canAddSong) {
            finalSongs.push({
                id: `song-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
                ...songDraft,
                year: Number(songDraft.year),
            });
        }
        if (!finalSongs.length) return;

        const newAlbum = {
            id: `album-${Date.now()}`,
            name: albumDraft.name.trim(),
            artist: albumDraft.artist.trim(),
            coverImage: albumDraft.coverImage,
            description: albumDraft.description.trim(),
            year: finalSongs[0]?.year || new Date().getFullYear(),
            songs: finalSongs,
            createdAt: new Date().toISOString(),
            userId: CURRENT_USER_ID
        };

        const next = [newAlbum, ...albums];
        persistAlbums(next);
        closeAllModals();
    };

    // ===== EDIT FLOW =====
    const openEditAlbum = (album) => {
        setEditAlbumId(album.id);
        setEditAlbumDraft({
            name: album.name,
            artist: album.artist || "",
            coverImage: album.coverImage,
            description: album.description,
        });
        setEditSongsDraft(album.songs || []);
        setIsEditModalOpen(true);
    };

    const addSongToEditDraft = () => {
        if (!canSaveEditSong) return;
        const newSong = {
            id: `song-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            ...editSongForm,
            year: Number(editSongForm.year),
        };
        setEditSongsDraft((prev) => [...prev, newSong]);
        setEditSongForm(emptySong);
        setIsAddingSong(false);
    };

    const removeSongFromEditDraft = (songId) => {
        setEditSongsDraft((prev) => prev.filter((s) => s.id !== songId));
    };

    const saveEditAlbum = () => {
        if (!editAlbumDraft.name.trim()) return;
        if (editSongsDraft.length === 0) return;

        const updated = albums.map((a) =>
            a.id === editAlbumId
                ? {
                    ...a,
                    name: editAlbumDraft.name.trim(),
                    artist: editAlbumDraft.artist.trim(),
                    coverImage: editAlbumDraft.coverImage,
                    description: editAlbumDraft.description.trim(),
                    year: editSongsDraft[0]?.year || a.year,
                    songs: editSongsDraft,
                }
                : a
        );
        persistAlbums(updated);
        closeAllModals();
    };

    // ===== DELETE =====
    const confirmDelete = (albumId) => {
        setDeleteTarget({ albumId });
        setIsDeleteConfirmOpen(true);
    };

    const executeDelete = () => {
        if (!deleteTarget) return;
        const updated = albums.filter((a) => a.id !== deleteTarget.albumId);
        persistAlbums(updated);
        closeAllModals();
    };

    // ===== ОТОБРАЖЕНИЕ АННОТАЦИЙ =====
    const displayedAnnotations = showAllAnnotations
        ? userAnnotations
        : userAnnotations.slice(0, 3);

    const hasMoreAnnotations = userAnnotations.length > 3;

    return (
        <div className={styles.page}>
            {/* NAVBAR */}
            <div className={styles.navbar}>
                <div className={styles.navLeft} onClick={() => navigate("/home")}>Home</div>
                <SearchBar
                    placeholder="Search lyrics or artists"
                    onSearch={(query) => console.log(query)}
                />
                <div className={styles.navRight} onClick={() => navigate("/admin")}>Admin</div>
                <div className={styles.navRight}>Profile</div>
            </div>

            {/* PROFILE HEADER */}
            <div className={styles.profileHeader}>
                <div className={styles.profileWrapper}>
                    <div className={styles.avatarContainer}>
                        <div className={styles.avatar}>
                            <span className={styles.avatarText}>Avatar</span>
                        </div>
                    </div>
                    <div className={styles.profileInfo}>
                        <div className={styles.usernameRow}>
                            <h2 className={styles.username}>@{mockUser.login}</h2>
                            <div className={styles.badges}>
                                <span className={styles.badge}>Artist</span>
                                <span className={styles.badge}>Editor</span>
                            </div>
                        </div>
                        <p className={styles.description}>{mockUser.description}</p>
                    </div>
                </div>
            </div>

            <div className={styles.contentWrapper}>
                {/* LEFT COLUMN - USER ALBUMS */}
                <div className={styles.column}>
                    <h3 className={styles.sectionTitle}>My albums</h3>
                    <div className={styles.list}>
                        {albums.length === 0 ? (
                            <div className={styles.emptyList}>No albums yet.</div>
                        ) : (
                            albums.map((album) => (
                                <div
                                    key={album.id}
                                    className={styles.listItem}
                                    onClick={() => navigate(`/album/${album.id}`)}
                                >
                                    <div style={{ display: "flex", alignItems: "center", gap: 12, width: "100%" }}>
                                        {/* Left: Cover + Info */}
                                        <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1, minWidth: 0 }}>
                                            {album.coverImage ? (
                                                <img src={album.coverImage} alt={album.name} className={styles.albumCover} />
                                            ) : (
                                                <div className={styles.albumCoverPlaceholder} />
                                            )}
                                            <div style={{ minWidth: 0 }}>
                                                <div className={styles.listItemTitle}>{album.name}</div>
                                                <div className={styles.listItemArtist}>
                                                    {album.songs?.length || 0} song{album.songs?.length !== 1 ? 's' : ''} • {album.year}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Right: Action buttons */}
                                        <div style={{ display: "flex", gap: 8, flexShrink: 0 }} onClick={(e) => e.stopPropagation()}>
                                            <button className={styles.iconBtn} onClick={() => openEditAlbum(album)} title="Edit album">
                                                ✎
                                            </button>
                                            <button className={styles.iconBtnDelete} onClick={() => confirmDelete(album.id)} title="Delete album">
                                                🗑
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                    <button className={styles.addLyricsButton} onClick={openCreateFlow}>+ Add</button>
                </div>

                {/* RIGHT COLUMN - USER'S ANNOTATIONS */}
                <div className={styles.column}>
                    <h3 className={styles.sectionTitle}>My Annotations</h3>
                    <div className={styles.list}>
                        {loadingAnnotations ? (
                            <div className={styles.emptyList}>Loading annotations...</div>
                        ) : userAnnotations.length === 0 ? (
                            <div className={styles.emptyList}>
                                <span style={{ fontSize: 24, display: "block", marginBottom: 8 }}>💬</span>
                                No annotations yet.<br/>
                                <span style={{ fontSize: 13, color: "#667788" }}>
                                    Go to a song and highlight text to add your first annotation!
                                </span>
                            </div>
                        ) : (
                            <>
                                {displayedAnnotations.map((ann) => {
                                    const status = ann.isVerified
                                        ? "approved"
                                        : (ann.status || "pending");

                                    return (
                                        <div
                                            key={ann.id}
                                            className={`${styles.annotationCard} ${styles[status]}`}
                                            onClick={() => {
                                                if (ann.albumId) {
                                                    navigate(`/album/${ann.albumId}`);
                                                }
                                            }}
                                            style={{ cursor: ann.albumId ? "pointer" : "default" }}
                                        >
                                            {/* Левая часть: контент аннотации */}
                                            <div className={styles.annotationContent}>
                                                {/* ← ДОБАВЛЕНО: Бейдж статуса */}
                                                <div className={styles.annotationStatusRow}>
                                                    <span className={`${styles.annotationStatus} ${styles[status]}`}>
                                                        {status === "approved"}
                                                        {status === "rejected" }
                                                        {status}
                                                    </span>
                                                </div>

                                                <div className={styles.listItemTitle} style={{ fontSize: 14 }}>
                                                    {ann.songName}
                                                </div>
                                                <div className={styles.listItemArtist} style={{ fontSize: 12, marginBottom: 6 }}>
                                                    {ann.albumName}
                                                </div>

                                                {/* Текст аннотации */}
                                                <div className={styles.annotationPreview}>
                                                    {ann.text || ann.lyricSnippet}
                                                </div>

                                                <div
                                                    className={styles.readReview}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        if (ann.albumId) {
                                                            navigate(`/album/${ann.albumId}`);
                                                        }
                                                    }}
                                                >
                                                    Read review →
                                                </div>
                                            </div>

                                            {/* Правая часть: кнопка удаления */}
                                            <button
                                                className={styles.deleteAnnotationBtn}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    confirmDeleteAnnotation(ann.id);
                                                }}
                                                title="Delete annotation"
                                            >
                                                🗑
                                            </button>
                                        </div>
                                    );
                                })}
                                {hasMoreAnnotations && (
                                    <button
                                        className={styles.showAllButton}
                                        onClick={() => setShowAllAnnotations(!showAllAnnotations)}
                                        type="button"
                                    >
                                        {showAllAnnotations
                                            ? "Show less"
                                            : `Show all (${userAnnotations.length})`
                                        }
                                    </button>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* ===== MODALS ===== */}

            {/* CREATE ALBUM - Step 1 */}
            {isCreateModalOpen && createStep === 'album' && (
                <div className={styles.modalOverlay} onClick={closeAllModals}>
                    <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                        <h3>Create Album</h3>

                        <input
                            className={styles.input}
                            placeholder="Album name *"
                            value={albumDraft.name}
                            onChange={(e) => setAlbumDraft((p) => ({ ...p, name: e.target.value }))}
                        />

                        <input
                            className={styles.input}
                            placeholder="Artist name"
                            value={albumDraft.artist}
                            onChange={(e) => setAlbumDraft((p) => ({ ...p, artist: e.target.value }))}
                        />

                        <div style={{ margin: "10px 0" }}>
                            <label style={{ display: "block", marginBottom: 4, color: "#b8c2cc" }}>Cover:</label>
                            <input type="file" accept="image/*" onChange={handleAlbumCover} />
                            {albumDraft.coverImage && (
                                <img src={albumDraft.coverImage} alt="cover" style={{ width: 70, height: 70, marginTop: 6, borderRadius: 8, objectFit: "cover" }} />
                            )}
                        </div>

                        <textarea
                            className={styles.textarea}
                            placeholder="Album description"
                            rows={4}
                            value={albumDraft.description}
                            onChange={(e) => setAlbumDraft((p) => ({ ...p, description: e.target.value }))}
                        />

                        <div className={styles.modalActions}>
                            <button className={styles.ghost} onClick={closeAllModals}>Cancel</button>
                            <button className={styles.primary} onClick={goToSongStep} disabled={!canContinueAlbum}>
                                + Add Song
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* CREATE ALBUM - Step 2: Add Songs */}
            {isCreateModalOpen && createStep === 'songs' && (
                <div className={styles.modalOverlay} onClick={closeAllModals}>
                    <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                        <h3>Add Songs</h3>
                        <p style={{ opacity: 0.8, marginTop: -8 }}>Album: {albumDraft.name}</p>

                        <input
                            className={styles.input}
                            placeholder="Song name *"
                            value={songDraft.name}
                            onChange={(e) => setSongDraft((p) => ({ ...p, name: e.target.value }))}
                        />
                        <textarea
                            className={styles.textarea}
                            placeholder="Song description"
                            rows={3}
                            value={songDraft.description}
                            onChange={(e) => setSongDraft((p) => ({ ...p, description: e.target.value }))}
                        />
                        <textarea
                            className={styles.textarea}
                            placeholder="Lyrics text *"
                            rows={6}
                            value={songDraft.text}
                            onChange={(e) => setSongDraft((p) => ({ ...p, text: e.target.value }))}
                        />

                        <div style={{ marginTop: 8, opacity: 0.8 }}>Added songs: {songsDraft.length}</div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 5, margin: "10px 0" }}>
                            {songsDraft.map((song, idx) => (
                                <div key={song.id} style={{ color: "#b8c2cc", fontSize: 15 }}>
                                    {idx + 1}. <b>{song.name}</b> ({song.year})
                                </div>
                            ))}
                        </div>

                        <div className={styles.modalActions}>
                            <button className={styles.ghost} onClick={closeAllModals}>Cancel</button>
                            <button className={styles.ghost} onClick={addSongToDraft} disabled={!canAddSong}>
                                + Add another
                            </button>
                            <button
                                className={styles.primary}
                                onClick={finishCreateAlbum}
                                disabled={songsDraft.length === 0 && !canAddSong}
                                title={songsDraft.length === 0 && !canAddSong
                                    ? "Add at least one song to finish"
                                    : "Finish creating album"}
                            >
                                Finish
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* EDIT ALBUM + SONGS MODAL */}
            {isEditModalOpen && (
                <div className={styles.modalOverlay} onClick={closeAllModals}>
                    <div className={`${styles.modal} ${styles.modalLarge}`} onClick={(e) => e.stopPropagation()}>
                        <h3>Edit Album</h3>

                        {/* Album info section */}
                        <div className={styles.editSection}>
                            <h4 style={{ margin: "0 0 12px", color: "#fff", fontSize: 15 }}>Album Details</h4>
                            <input
                                className={styles.input}
                                placeholder="Album name *"
                                value={editAlbumDraft.name}
                                onChange={(e) => setEditAlbumDraft((p) => ({ ...p, name: e.target.value }))}
                            />
                            <input
                                className={styles.input}
                                placeholder="Artist name"
                                value={editAlbumDraft.artist}
                                onChange={(e) => setEditAlbumDraft((p) => ({ ...p, artist: e.target.value }))}
                            />
                            <div style={{ margin: "10px 0" }}>
                                <label style={{ display: "block", marginBottom: 4, color: "#b8c2cc" }}>Cover:</label>
                                <input type="file" accept="image/*" onChange={handleEditAlbumCover} />
                                {editAlbumDraft.coverImage && (
                                    <img src={editAlbumDraft.coverImage} alt="cover" style={{ width: 70, height: 70, marginTop: 6, borderRadius: 8, objectFit: "cover" }} />
                                )}
                            </div>
                            <textarea
                                className={styles.textarea}
                                placeholder="Album description"
                                rows={3}
                                value={editAlbumDraft.description}
                                onChange={(e) => setEditAlbumDraft((p) => ({ ...p, description: e.target.value }))}
                            />
                        </div>

                        {/* Songs section */}
                        <div className={styles.editSection}>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                                <h4 style={{ margin: 0, color: "#fff", fontSize: 15 }}>Songs ({editSongsDraft.length})</h4>
                                {!isAddingSong && (
                                    <button
                                        className={styles.tinyBtn}
                                        onClick={() => {
                                            setEditSongForm(emptySong);
                                            setIsAddingSong(true);
                                        }}
                                        style={{ fontSize: 12 }}
                                    >
                                        + Add Song
                                    </button>
                                )}
                            </div>

                            {/* Add song form */}
                            {isAddingSong && (
                                <div style={{ background: "#0b1623", padding: 12, borderRadius: 8, marginBottom: 12 }}>
                                    <input
                                        className={styles.input}
                                        placeholder="Song name *"
                                        value={editSongForm.name}
                                        onChange={(e) => setEditSongForm((p) => ({ ...p, name: e.target.value }))}
                                        style={{ marginBottom: 8 }}
                                    />
                                    <input
                                        className={styles.input}
                                        placeholder="Year *"
                                        type="number"
                                        value={editSongForm.year}
                                        onChange={(e) => setEditSongForm((p) => ({ ...p, year: e.target.value }))}
                                        style={{ marginBottom: 8 }}
                                    />
                                    <textarea
                                        className={styles.textarea}
                                        placeholder="Lyrics text *"
                                        rows={4}
                                        value={editSongForm.text}
                                        onChange={(e) => setEditSongForm((p) => ({ ...p, text: e.target.value }))}
                                        style={{ marginBottom: 8 }}
                                    />
                                    <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                                        <button
                                            className={styles.ghost}
                                            onClick={() => {
                                                setIsAddingSong(false);
                                                setEditSongForm(emptySong);
                                            }}
                                            style={{ padding: "6px 12px", fontSize: 13 }}
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            className={styles.primary}
                                            onClick={addSongToEditDraft}
                                            disabled={!canSaveEditSong}
                                            style={{ padding: "6px 12px", fontSize: 13 }}
                                        >
                                            Add
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Songs list */}
                            <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 200, overflowY: "auto" }}>
                                {editSongsDraft.map((song, idx) => (
                                    <div
                                        key={song.id}
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "space-between",
                                            background: "#0b1623",
                                            padding: "10px 12px",
                                            borderRadius: 6,
                                            fontSize: 14,
                                        }}
                                    >
                                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                            <span style={{ color: "#667788", minWidth: 20 }}>{idx + 1}.</span>
                                            <div>
                                                <div style={{ color: "#fff", fontWeight: 500 }}>{song.name}</div>
                                                <div style={{ color: "#8899a6", fontSize: 12 }}>{song.year}</div>
                                            </div>
                                        </div>
                                        <button
                                            className={styles.tinyBtnDelete}
                                            onClick={() => removeSongFromEditDraft(song.id)}
                                            style={{ padding: "4px 8px", fontSize: 11 }}
                                        >
                                            Remove
                                        </button>
                                    </div>
                                ))}
                                {editSongsDraft.length === 0 && (
                                    <div style={{ color: "#8899a6", fontSize: 13, textAlign: "center", padding: 20 }}>
                                        No songs yet. Add one above!
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Actions */}
                        <div className={styles.modalActions}>
                            <button className={styles.ghost} onClick={closeAllModals}>Cancel</button>
                            <button
                                className={styles.primary}
                                onClick={saveEditAlbum}
                                disabled={!editAlbumDraft.name.trim() || editSongsDraft.length === 0}
                            >
                                Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* DELETE CONFIRMATION */}
            {isDeleteConfirmOpen && (
                <div className={styles.modalOverlay} onClick={closeAllModals}>
                    <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                        <h3 style={{ color: "#ff6b6b" }}>⚠️ Confirm Delete</h3>
                        <p style={{ color: "#b8c2cc", margin: "12px 0" }}>
                            {deleteAnnotationId
                                ? "Are you sure you want to delete this annotation?"
                                : "Delete this album and all its songs?"
                            }
                        </p>
                        <p style={{ fontSize: 13, color: "#8899a6", marginBottom: 20 }}>
                            This action cannot be undone.
                        </p>
                        <div className={styles.modalActions}>
                            <button className={styles.ghost} onClick={closeAllModals}>Cancel</button>
                            <button
                                className={styles.danger}
                                onClick={deleteAnnotationId ? executeDeleteAnnotation : executeDelete}
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProfilePage;