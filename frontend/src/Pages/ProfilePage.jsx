// src/pages/ProfilePage/ProfilePage.jsx
import { useNavigate } from "react-router-dom";
import { useState, useMemo, useEffect } from "react";
import styles from "./Profile.module.css";

// Компоненты
import Navbar from "../Components/NavBar/NavBar.jsx";

// Контекст и хуки
import { useAuth } from "../context/AuthContext";
import {
    useCurrentUser,
    useUserAlbums,
    useUserAnnotations,
    useUpdateProfile,
    useDeleteAlbum,
    useDeleteAnnotation,
    useCreateAlbum,
} from "../hooks";

// Утилиты
import { toFormData } from "../api/apiService";

const CDN_BASE = "http://localhost:9000";

// Начальные состояния для форм (вынесены за компонент)
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
    const { user: authUser } = useAuth();
    const userId = authUser?.id;

    // 🔥 React Query: загрузка данных (больше никаких useState для серверных данных!)
    const {
        user: profile,
        isLoading: loadingProfile,
        isError: profileError,
        invalidate: invalidateProfile,
    } = useCurrentUser();

    const {
        albums,
        isLoading: loadingAlbums,
        invalidate: invalidateAlbums,
    } = useUserAlbums(userId);

    const {
        annotations: userAnnotations,
        isLoading: loadingAnnotations,
        invalidate: invalidateAnnotations,
    } = useUserAnnotations(userId);

    // 🔥 React Query: мутации (создание/обновление/удаление)
    const updateProfileMutation = useUpdateProfile(userId);
    const deleteAlbumMutation = useDeleteAlbum();
    const deleteAnnotationMutation = useDeleteAnnotation();
    const createAlbumMutation = useCreateAlbum(userId);

    // 🔥 Локальные стейты — только для UI (модалки, формы, превью)
    const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
    const [editLogin, setEditLogin] = useState("");
    const [editDescription, setEditDescription] = useState("");
    const [editAvatarFile, setEditAvatarFile] = useState(null);
    const [avatarPreview, setAvatarPreview] = useState(null);

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState(null);

    const [showSongStep, setShowSongStep] = useState(false);
    const [albumDraft, setAlbumDraft] = useState(emptyAlbumState);
    const [songsDraft, setSongsDraft] = useState([]);
    const [songDraft, setSongDraft] = useState(emptySongState);

    const [showAllAnnotations, setShowAllAnnotations] = useState(false);

    // Вычисляемые значения
    const avatarUrl = useMemo(() => {
        const imageUrl = profile?.imageUrl;
        if (!imageUrl) return "";
        return `${CDN_BASE}/${imageUrl}`;
    }, [profile?.imageUrl]);

    const visibleLogin = profile?.login || authUser?.login || "unknown";
    const visibleDescription = profile?.description ?? "No description.";

    // 🔥 Синхронизация формы редактирования с данными профиля
    useEffect(() => {
        if (profile && isEditProfileOpen) {
            setEditLogin(profile.login || "");
            setEditDescription(profile.description || "");
        }
    }, [profile, isEditProfileOpen]);

    // 🔥 Очистка превью аватара при размонтировании
    useEffect(() => {
        return () => {
            if (avatarPreview) {
                URL.revokeObjectURL(avatarPreview);
            }
        };
    }, [avatarPreview]);

    // ===== Edit profile =====
    const handleOpenEditProfile = () => {
        setEditLogin(profile?.login || "");
        setEditDescription(profile?.description || "");
        setEditAvatarFile(null);
        setAvatarPreview(null);
        setIsEditProfileOpen(true);
    };

    const handleAvatarChange = (e) => {
        const file = e.target.files?.[0];
        setEditAvatarFile(file || null);

        if (file) {
            // Создаём превью
            const url = URL.createObjectURL(file);
            setAvatarPreview(url);
        } else {
            setAvatarPreview(null);
        }
    };

    const handleSaveProfile = async () => {
        const login = editLogin.trim();
        if (!login) {
            alert("Login is required");
            return;
        }

        try {
            // ✅ Мутация сама преобразует данные в FormData при необходимости
            await updateProfileMutation.mutateAsync({
                login,
                description: editDescription,
                image: editAvatarFile,
            });

            setIsEditProfileOpen(false);
            // 🔥 Кэш профиля обновится автоматически благодаря invalidateQueries в мутации!
        } catch (e) {
            console.error("Failed to update profile:", e);
            alert(e?.response?.data?.message || "Failed to update profile");
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
            // 🔥 Мутация сама формирует правильный FormData с camelCase ключами
            await createAlbumMutation.mutateAsync({
                albumData: {
                    name: albumDraft.name,
                    description: albumDraft.description,
                    year: albumDraft.year, // ✅ Используем год из альбома, а не из первой песни!
                    coverFile: albumDraft.coverFile,
                },
                songs: songsDraft,
            });

            handleCloseModals();
            // 🔥 Списки альбомов обновятся автоматически
        } catch (err) {
            console.error("Create album error:", err);
            const errorMsg = err?.response?.data?.message || err?.response?.data?.errors || "Ошибка создания альбома!";
            alert(typeof errorMsg === "object" ? JSON.stringify(errorMsg) : errorMsg);
        }
    };

    // ===== Delete album/annotation =====
    const handleConfirmDelete = (type, id) => {
        setDeleteTarget({ type, id });
        setIsDeleteConfirmOpen(true);
    };

    const handleExecuteDelete = async () => {
        if (!deleteTarget || !userId) return;

        try {
            if (deleteTarget.type === "album") {
                await deleteAlbumMutation.mutateAsync({
                    albumId: deleteTarget.id,
                    userId,
                });
            } else if (deleteTarget.type === "annotation") {
                await deleteAnnotationMutation.mutateAsync({
                    annotationId: deleteTarget.id,
                    userId,
                });
            }
            handleCloseModals();
        } catch (err) {
            console.error("Delete error:", err);
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

    const displayedAnnotations = showAllAnnotations
        ? userAnnotations
        : userAnnotations?.slice(0, 3) || [];

    const hasMoreAnnotations = (userAnnotations?.length || 0) > 3;

    // 🔥 Сводные состояния загрузки и ошибок
    const isLoading = loadingProfile || loadingAlbums || loadingAnnotations;
    const isSaving =
        updateProfileMutation.isPending ||
        createAlbumMutation.isPending ||
        deleteAlbumMutation.isPending ||
        deleteAnnotationMutation.isPending;

    // 🔥 Обработка ошибки загрузки профиля
    if (profileError) {
        return (
            <div className={styles.errorPage}>
                <h2>Failed to load profile</h2>
                <p>Please try to log in again.</p>
                <button onClick={() => (window.location.href = "/login")}>Go to login</button>
            </div>
        );
    }

    const truncateText = (text, maxLength = 20) => {
        if (!text) return "";
        if (text.length <= maxLength) return text;
        return text.slice(0, maxLength) + "...";
    };

    return (
        <div className={styles.page}>
            <Navbar />

            {/* PROFILE HEADER */}
            <div className={styles.profileHeader}>
                <div className={styles.profileWrapper}>
                    <div className={styles.avatarContainer}>
                        <div className={styles.avatar}>
                            {avatarPreview ? (
                                <img className={styles.avatarImg} src={avatarPreview} alt="preview" />
                            ) : avatarUrl ? (
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
                                disabled={loadingProfile || isSaving}
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
                    ) : !albums?.length ? (
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
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleConfirmDelete("album", album.id);
                                                }}
                                                title="Delete album"
                                                disabled={deleteAlbumMutation.isPending}
                                            >
                                                {deleteAlbumMutation.isPending ? "⏳" : "🗑"}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    <button
                        className={styles.addLyricsButton}
                        onClick={handleOpenCreate}
                        disabled={isSaving}
                    >
                        {isSaving ? "Creating..." : "+ Add"}
                    </button>
                </div>

                {/* RIGHT COLUMN - ANNOTATIONS */}
                <div className={styles.column}>
                    <h3 className={styles.sectionTitle}>My Annotations</h3>

                    {loadingAnnotations ? (
                        <div className={styles.emptyList}>Loading annotations...</div>
                    ) : !userAnnotations?.length ? (
                        <div className={styles.emptyList}>
                            No annotations yet.
                        </div>
                    ) : (
                        <div className={styles.list}>
                            {displayedAnnotations.map((ann) => {
                                const status = resolveAnnotationStatus(ann);
                                const truncatedText = truncateText(ann.text, 20);
                                return (
                                    <div
                                        key={ann.id}
                                        className={`${styles.annotationRow} ${styles[status]}`}
                                        // ✅ Клик по всей строке — переход к песне
                                        onClick={() => navigate(`/song/${ann.lyricsId}`)}
                                        style={{ cursor: "pointer" }}
                                    >
                                        <div className={styles.annotationStatusCol}>
                                            <span className={`${styles.annotationStatus} ${styles[status]}`}>{status}</span>
                                        </div>
                                        <div className={styles.annotationQuote}>
                                            <div className={styles.annotationText}>
                                                {truncatedText || "No annotation text"}
                                            </div>
                                        </div>
                                        <div className={styles.annotationActionCol} onClick={(e) => e.stopPropagation()}>
                                            <button
                                                className={styles.deleteAnnotationBtn}
                                                onClick={(e) => {
                                                    e.stopPropagation(); // ✅ Останавливаем всплытие, чтобы не сработал переход
                                                    handleConfirmDelete("annotation", ann.id);
                                                }}
                                                title="Delete annotation"
                                                disabled={deleteAnnotationMutation.isPending}
                                            >
                                                {deleteAnnotationMutation.isPending ? "⏳" : "🗑"}
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}

                            {hasMoreAnnotations && (
                                <button
                                    className={styles.showAllButton}
                                    onClick={(e) => {
                                        e.stopPropagation(); // Чтобы клик не триггерил переход
                                        setShowAllAnnotations((a) => !a);
                                    }}
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
                <div
                    className={styles.modalOverlay}
                    onClick={() => !isSaving && setIsEditProfileOpen(false)}
                >
                    <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                        <h3>Edit profile</h3>

                        <div className={styles.field}>
                            <label className={styles.label}>Avatar</label>
                            <input
                                className={styles.input}
                                type="file"
                                accept="image/*"
                                onChange={handleAvatarChange}
                                disabled={isSaving}
                            />
                            {avatarPreview && (
                                <img
                                    src={avatarPreview}
                                    alt="preview"
                                    style={{ maxWidth: 100, marginTop: 8, borderRadius: 8 }}
                                />
                            )}
                        </div>

                        <div className={styles.field}>
                            <label className={styles.label}>Login</label>
                            <input
                                className={styles.input}
                                value={editLogin}
                                onChange={(e) => setEditLogin(e.target.value)}
                                disabled={isSaving}
                            />
                        </div>

                        <div className={styles.field}>
                            <label className={styles.label}>Description</label>
                            <textarea
                                className={styles.textarea}
                                rows={4}
                                value={editDescription}
                                onChange={(e) => setEditDescription(e.target.value)}
                                disabled={isSaving}
                            />
                        </div>

                        <div className={styles.modalActions}>
                            <button
                                className={styles.ghost}
                                onClick={() => setIsEditProfileOpen(false)}
                                disabled={isSaving}
                            >
                                Cancel
                            </button>
                            <button
                                className={styles.primary}
                                onClick={handleSaveProfile}
                                disabled={isSaving || !updateProfileMutation.isIdle}
                            >
                                {isSaving ? "Saving..." : "Save"}
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
                            <button
                                className={styles.primary}
                                onClick={() => setShowSongStep(true)}
                                disabled={!canContinueAlbum}
                            >
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
                                    {i + 1}. <b>{song.name}</b>{" "}
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
                            <button
                                className={styles.primary}
                                onClick={handleFinishCreate}
                                disabled={songsDraft.length === 0 || createAlbumMutation.isPending}
                            >
                                {createAlbumMutation.isPending ? "Creating..." : "Finish"}
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
                            <button
                                className={styles.danger}
                                onClick={handleExecuteDelete}
                                disabled={deleteAlbumMutation.isPending || deleteAnnotationMutation.isPending}
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