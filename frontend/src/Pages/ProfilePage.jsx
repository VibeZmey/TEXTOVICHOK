import { useNavigate } from "react-router-dom";
import { useState, useEffect, useMemo } from "react";
import styles from "./Profile.module.css";
import SearchBar from "../Components/SearchBar/SearchBar";
import { useAuth } from "../context/AuthContext";
import { userService, albumService, annotationService, lyricsService } from "../api/apiService";
import Navbar from "../Components/NavBar/NavBar.jsx";

const CDN_BASE = "http://localhost:9000";

const emptyAlbumState = {
    name: "",
    description: "",
    year: new Date().getFullYear(),
    coverFile: null,
};

const emptySongState = {
    name: "",
    year: new Date().getFullYear(),
    description: "",
    text: "",
};

const ProfilePage = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const userId = user?.id;

    // profile
    const [profile, setProfile] = useState(null);
    const [loadingProfile, setLoadingProfile] = useState(true);

    // edit profile modal
    const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
    const [editLogin, setEditLogin] = useState("");
    const [editDescription, setEditDescription] = useState("");
    const [editAvatarFile, setEditAvatarFile] = useState(null);
    const [savingProfile, setSavingProfile] = useState(false);

    // albums/annotations
    const [albums, setAlbums] = useState([]);
    const [userAnnotations, setUserAnnotations] = useState([]);
    const [loadingAlbums, setLoadingAlbums] = useState(true);
    const [loadingAnnotations, setLoadingAnnotations] = useState(true);

    // modals (create/delete)
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState(null); // { type, id }

    // create album wizard
    const [showSongStep, setShowSongStep] = useState(false);
    const [albumDraft, setAlbumDraft] = useState(emptyAlbumState);
    const [songsDraft, setSongsDraft] = useState([]);
    const [songDraft, setSongDraft] = useState(emptySongState);

    // annotations UI
    const [showAllAnnotations, setShowAllAnnotations] = useState(false);

    // cache: lyricsId -> lyricsDto
    const [lyricsById, setLyricsById] = useState({});

    const avatarUrl = useMemo(() => {
        const imageUrl = profile?.imageUrl; // <— предполагаем это поле, как у альбома
        if (!imageUrl) return "";
        return `${CDN_BASE}/${imageUrl}`;
    }, [profile?.imageUrl]);

    const visibleLogin = profile?.login || user?.login || "unknown";
    const visibleDescription = profile?.description ?? "No description.";

    const loadProfile = async () => {
        if (!userId) return;
        setLoadingProfile(true);
        try {
            const res = await userService.getProfile();
            const p = res?.data || null;
            setProfile(p);

            setEditLogin(p?.login || "");
            setEditDescription(p?.description || "");
            setEditAvatarFile(null);
        } catch (e) {
            console.error("Failed to load profile:", e?.response?.data || e);
            setProfile(null);
        } finally {
            setLoadingProfile(false);
        }
    };

    const loadLists = async () => {
        if (!userId) return;

        setLoadingAlbums(true);
        setLoadingAnnotations(true);

        try {
            const [albumsRes, annsRes] = await Promise.all([
                userService.getUserAlbums(userId),
                userService.getUserAnnotations(userId),
            ]);

            setAlbums(Array.isArray(albumsRes?.data) ? albumsRes.data : []);
            setUserAnnotations(Array.isArray(annsRes?.data) ? annsRes.data : []);
        } catch (e) {
            console.error("Failed to load lists:", e?.response?.data || e);
            setAlbums([]);
            setUserAnnotations([]);
        } finally {
            setLoadingAlbums(false);
            setLoadingAnnotations(false);
        }
    };

    useEffect(() => {
        if (!userId) return;
        loadProfile();
        loadLists();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userId]);

    // ===== Edit profile =====
    const handleOpenEditProfile = () => {
        setIsEditProfileOpen(true);
        setEditLogin(profile?.login || user?.login || "");
        setEditDescription(profile?.description || "");
        setEditAvatarFile(null);
    };

    const handleSaveProfile = async () => {
        if (!userId) return;

        const login = editLogin.trim();
        if (!login) {
            alert("Login is required");
            return;
        }

        setSavingProfile(true);
        try {
            // ВАЖНО: ключи как в твоём swagger-подходе с альбомом: PascalCase
            // Если бэк ждёт другие названия — скажи, подстрою.
            const fd = new FormData();
            fd.append("Login", login);
            fd.append("Description", editDescription || "");
            if (editAvatarFile) fd.append("Image", editAvatarFile);

            await userService.updateUser(userId, fd);

            setIsEditProfileOpen(false);
            await loadProfile();
        } catch (e) {
            console.error("Failed to update profile:", e?.response?.data || e);
            alert("Failed to update profile");
        } finally {
            setSavingProfile(false);
        }
    };

    // ===== Create album =====
    const canContinueAlbum = albumDraft.name.trim().length > 0;

    const handleOpenCreate = () => {
        setAlbumDraft(emptyAlbumState);
        setSongsDraft([]);
        setSongDraft(emptySongState);
        setShowSongStep(false);
        setIsCreateModalOpen(true);
    };

    const canAddSong = () => songDraft.name.trim() && songDraft.text.trim();

    const handleAddSong = () => {
        if (!canAddSong()) return;
        setSongsDraft((prev) => [
            ...prev,
            { ...songDraft, year: Number(songDraft.year) || new Date().getFullYear() },
        ]);
        setSongDraft(emptySongState);
    };

    const handleRemoveSong = (i) => setSongsDraft((prev) => prev.filter((_, idx) => idx !== i));

    const handleFinishCreate = async () => {
        if (!albumDraft.name.trim() || songsDraft.length === 0) {
            alert("Album name and at least 1 song required!");
            return;
        }

        try {
            const fd = new FormData();
            fd.append("Name", albumDraft.name);
            fd.append("Description", albumDraft.description || "");
            fd.append("UserId", userId);
            fd.append("Year", String(songsDraft[0].year || new Date().getFullYear()));
            if (albumDraft.coverFile) fd.append("Image", albumDraft.coverFile);

            const albumRes = await albumService.create(fd);
            const album = albumRes.data;

            for (const [i, song] of songsDraft.entries()) {
                await lyricsService.create({
                    name: song.name,
                    albumId: album.id,
                    orderIndex: i,
                    text: song.text,
                    duration: 0,
                    description: song.description || "",
                });
            }

            console.log(profile);

            await loadLists();
            handleCloseModals();
        } catch (err) {
            if (err?.response) {
                console.error(err.response.data);
                alert(JSON.stringify(err.response.data.errors || err.response.data, null, 2));
            } else {
                alert("Ошибка создания альбома!");
            }
        }
    };

    // ===== Delete album/annotation =====
    const handleConfirmDelete = (type, id) => {
        setDeleteTarget({ type, id });
        setIsDeleteConfirmOpen(true);
    };


    const handleExecuteDelete = async () => {
        if (!deleteTarget) return;

        try {
            if (deleteTarget.type === "album") {
                await albumService.delete(deleteTarget.id);
            } else if (deleteTarget.type === "annotation") {
                await annotationService.delete(deleteTarget.id);
            }

            await loadLists();
            handleCloseModals();
        } catch (err) {
            console.error("DELETE error full:", err);
            console.error("DELETE error response:", err?.response?.data);
            console.error("DELETE error request:", err?.request);
            alert("Delete failed");
        }
    };

    const handleCloseModals = () => {
        setIsCreateModalOpen(false);
        setShowSongStep(false);
        setIsDeleteConfirmOpen(false);
        setDeleteTarget(null);

        setAlbumDraft(emptyAlbumState);
        setSongDraft(emptySongState);
        setSongsDraft([]);
    };

    // ===== Annotations display =====
    const resolveAnnotationStatus = (ann) => {
        if (ann.isVerified) return "approved";
        if (ann.isRejected) return "rejected";
        return "pending";
    };

    const displayedAnnotations = showAllAnnotations ? userAnnotations : userAnnotations.slice(0, 3);
    const hasMoreAnnotations = userAnnotations.length > 3;

    const getSongNameByAnnotation = (ann) => {
        const lyr = lyricsById[ann.lyricsId];
        return lyr?.name || lyr?.title || "Unknown song";
    };


    return (
        <div className={styles.page}>
            {/* NAVBAR */}
            <Navbar/>

            {/* PROFILE HEADER */}
            <div className={styles.profileHeader}>
                <div className={styles.profileWrapper}>
                    <div className={styles.avatarContainer}>
                        <div className={styles.avatar}>
                            {avatarUrl ? (
                                <img className={styles.avatarImg} src={avatarUrl} alt="avatar" />
                            ) : (
                                <span className={styles.avatarText}>
                  {(visibleLogin[0] || "A").toUpperCase()}
                </span>
                            )}
                        </div>
                    </div>

                    <div className={styles.profileInfo}>
                        <div className={styles.usernameRow}>
                            <h2 className={styles.username}>@{visibleLogin}</h2>

                            <div className={styles.userBadges}>
                                {profile?.isArtist && <span className={styles.badgeArtist}>Artist</span>}
                                {profile?.isEditor && <span className={styles.badgeEditor}>Editor</span>}
                            </div>

                            <button
                                className={styles.editBtnRight}
                                onClick={handleOpenEditProfile}
                                disabled={loadingProfile}
                                title="Edit profile"
                            >
                                Edit
                            </button>
                        </div>

                        <p className={styles.description}>
                            {loadingProfile ? "Loading profile..." : visibleDescription}
                        </p>
                    </div>
                </div>
            </div>

            <div className={styles.contentWrapper}>
                {/* LEFT COLUMN - ALBUMS */}
                <div className={styles.column}>
                    <h3 className={styles.sectionTitle}>My albums</h3>

                    {loadingAlbums ? (
                        <div className={styles.emptyList}>Loading albums...</div>
                    ) : albums.length === 0 ? (
                        <div className={styles.emptyList}>No albums yet.</div>
                    ) : (
                        <div className={styles.list}>
                            {albums.map((album) => (
                                <div
                                    key={album.id}
                                    className={styles.listItem}
                                    onClick={() => navigate(`/album/${album.id}`)}
                                >
                                    <div style={{ display: "flex", alignItems: "center", gap: 12, width: "100%" }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1, minWidth: 0 }}>
                                            {album.imageUrl ? (
                                                <img
                                                    src={`${CDN_BASE}/${album.imageUrl}`}
                                                    alt={album.name}
                                                    className={styles.albumCover}
                                                />
                                            ) : album.coverImage ? (
                                                <img
                                                    src={album.coverImage}
                                                    alt={album.name}
                                                    className={styles.albumCover}
                                                />
                                            ) : (
                                                <div className={styles.albumCoverPlaceholder} />
                                            )}

                                            <div style={{ minWidth: 0 }}>
                                                <div className={styles.listItemTitle}>{album.name}</div>
                                                <div className={styles.listItemArtist}>{album.year}</div>
                                            </div>
                                        </div>

                                        <div style={{ display: "flex", gap: 8, flexShrink: 0 }} onClick={(e) => e.stopPropagation()}>
                                            <button
                                                className={styles.iconBtnDelete}
                                                onClick={() => handleConfirmDelete("album", album.id)}
                                                title="Delete album"
                                            >
                                                🗑
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    <button className={styles.addLyricsButton} onClick={handleOpenCreate}>+ Add</button>
                </div>

                {/* RIGHT COLUMN - ANNOTATIONS */}
                <div className={styles.column}>
                    <h3 className={styles.sectionTitle}>My Annotations</h3>

                    {loadingAnnotations ? (
                        <div className={styles.emptyList}>Loading annotations...</div>
                    ) : userAnnotations.length === 0 ? (
                        <div className={styles.emptyList}>
                            <span style={{ fontSize: 24 }}>💬</span> No annotations yet.
                        </div>
                    ) : (
                        <div className={styles.list}>
                            {displayedAnnotations.map((ann) => {
                                const status = resolveAnnotationStatus(ann);

                                return (
                                    <div key={ann.id} className={`${styles.annotationRow} ${styles[status]}`}>
                                        {/* left: status */}
                                        <div className={styles.annotationStatusCol}>
                                            <span className={`${styles.annotationStatus} ${styles[status]}`}>{status}</span>
                                        </div>

                                        {/* center: song/album/text */}
                                        <div className={styles.annotationMainCol}>
                                            <div className={styles.annotationText}>
                                                {ann.text || "No annotation text"}
                                            </div>
                                        </div>

                                        {/* right: delete */}
                                        <div className={styles.annotationActionCol}>
                                            <button
                                                className={styles.deleteAnnotationBtn}
                                                onClick={(e) => { e.stopPropagation(); handleConfirmDelete("annotation", ann.id); }}
                                                title="Delete annotation"
                                            >
                                                🗑
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}

                            {hasMoreAnnotations && (
                                <button
                                    className={styles.showAllButton}
                                    onClick={() => setShowAllAnnotations((a) => !a)}
                                    type="button"
                                >
                                    {showAllAnnotations ? "Show less" : `Show all (${userAnnotations.length})`}
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* ===== EDIT PROFILE MODAL ===== */}
            {isEditProfileOpen && (
                <div className={styles.modalOverlay} onClick={() => !savingProfile && setIsEditProfileOpen(false)}>
                    <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                        <h3>Edit profile</h3>

                        <div className={styles.field}>
                            <label className={styles.label}>Avatar</label>
                            <input
                                className={styles.input}
                                type="file"
                                accept="image/*"
                                onChange={(e) => setEditAvatarFile(e.target.files?.[0] || null)}
                                disabled={savingProfile}
                            />
                        </div>

                        <div className={styles.field}>
                            <label className={styles.label}>Login</label>
                            <input
                                className={styles.input}
                                value={editLogin}
                                onChange={(e) => setEditLogin(e.target.value)}
                                disabled={savingProfile}
                            />
                        </div>

                        <div className={styles.field}>
                            <label className={styles.label}>Description</label>
                            <textarea
                                className={styles.textarea}
                                rows={4}
                                value={editDescription}
                                onChange={(e) => setEditDescription(e.target.value)}
                                disabled={savingProfile}
                            />
                        </div>

                        <div className={styles.modalActions}>
                            <button className={styles.ghost} onClick={() => setIsEditProfileOpen(false)} disabled={savingProfile}>
                                Cancel
                            </button>
                            <button className={styles.primary} onClick={handleSaveProfile} disabled={savingProfile}>
                                {savingProfile ? "Saving..." : "Save"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ===== CREATE MODAL: album step 1 ===== */}
            {isCreateModalOpen && !showSongStep && (
                <div className={styles.modalOverlay} onClick={handleCloseModals}>
                    <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                        <h3>Create Album</h3>
                        <input
                            className={styles.input}
                            placeholder="Album name *"
                            value={albumDraft.name}
                            onChange={(e) => setAlbumDraft((d) => ({ ...d, name: e.target.value }))}
                        />
                        <textarea
                            className={styles.textarea}
                            placeholder="Album description"
                            value={albumDraft.description}
                            onChange={(e) => setAlbumDraft((d) => ({ ...d, description: e.target.value }))}
                        />
                        <input
                            className={styles.input}
                            placeholder="Album year"
                            type="number"
                            value={albumDraft.year}
                            onChange={(e) => setAlbumDraft((d) => ({ ...d, year: Number(e.target.value) }))}
                        />
                        <input
                            className={styles.input}
                            type="file"
                            accept="image/*"
                            onChange={(e) => setAlbumDraft((d) => ({ ...d, coverFile: e.target.files?.[0] || null }))}
                        />
                        <div className={styles.modalActions}>
                            <button className={styles.ghost} onClick={handleCloseModals}>Cancel</button>
                            <button className={styles.primary} onClick={() => setShowSongStep(true)} disabled={!canContinueAlbum}>
                                + Add Songs
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ===== CREATE MODAL: album step 2 ===== */}
            {isCreateModalOpen && showSongStep && (
                <div className={styles.modalOverlay} onClick={handleCloseModals}>
                    <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                        <h3>Add Songs</h3>
                        <input
                            className={styles.input}
                            placeholder="Song name *"
                            value={songDraft.name}
                            onChange={(e) => setSongDraft((s) => ({ ...s, name: e.target.value }))}
                        />
                        <input
                            className={styles.input}
                            placeholder="Year"
                            type="number"
                            value={songDraft.year}
                            onChange={(e) => setSongDraft((s) => ({ ...s, year: e.target.value }))}
                        />
                        <textarea
                            className={styles.textarea}
                            placeholder="Lyrics text *"
                            value={songDraft.text}
                            onChange={(e) => setSongDraft((s) => ({ ...s, text: e.target.value }))}
                        />
                        <textarea
                            className={styles.textarea}
                            placeholder="Song description"
                            value={songDraft.description}
                            onChange={(e) => setSongDraft((s) => ({ ...s, description: e.target.value }))}
                        />

                        <div style={{ marginTop: 8, opacity: 0.8 }}>Added songs: {songsDraft.length}</div>
                        <div style={{ marginBottom: 8 }}>
                            {songsDraft.map((song, i) => (
                                <div key={i} style={{ color: "#888", display: "flex", alignItems: "center", gap: 6 }}>
                                    {i + 1}. <b>{song.name}</b> ({song.year}){" "}
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveSong(i)}
                                        style={{ color: "#e66", border: "none", background: "none", cursor: "pointer" }}
                                    >
                                        ✕
                                    </button>
                                </div>
                            ))}
                        </div>

                        <div className={styles.modalActions}>
                            <button className={styles.ghost} onClick={handleCloseModals}>Cancel</button>
                            <button className={styles.ghost} onClick={handleAddSong} disabled={!canAddSong()}>
                                + Add another
                            </button>
                            <button className={styles.primary} onClick={handleFinishCreate} disabled={songsDraft.length === 0}>
                                Finish
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ===== DELETE CONFIRM MODAL ===== */}
            {isDeleteConfirmOpen && (
                <div className={styles.modalOverlay} onClick={handleCloseModals}>
                    <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                        <h3 style={{ color: "#ff6b6b" }}>⚠️ Confirm Delete</h3>
                        <p style={{ color: "#b8c2cc", margin: "12px 0" }}>
                            {deleteTarget?.type === "annotation"
                                ? "Are you sure you want to delete this annotation?"
                                : "Delete this album and all its songs?"}
                        </p>
                        <div className={styles.modalActions}>
                            <button className={styles.ghost} onClick={handleCloseModals}>Cancel</button>
                            <button className={styles.danger} onClick={handleExecuteDelete}>Delete</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProfilePage;