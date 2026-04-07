// src/pages/AdminPage/AdminPage.jsx
import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./AdminPage.module.css";

// Компоненты
import Navbar from "../Components/NavBar/NavBar.jsx";
import AdminAlbumCard from "./AdminAlbumCard.jsx";

// Хуки
import {
    useAllUsers,
    useUserAlbums,
    useUserAnnotations,
    useBlockUser,
    useApproveAnnotation,
    useRejectAnnotation,
} from "../hooks";

const CDN_BASE = "http://localhost:9000";

const AdminPage = () => {
    const navigate = useNavigate();

    // React Query: загрузка данных
    const {
        users,
        isLoading: usersLoading,
        isError: usersError
    } = useAllUsers();

    // 🔥 Локальные стейты — только для UI
    const [selectedUser, setSelectedUser] = useState(null);
    const [userSearchQuery, setUserSearchQuery] = useState("");
    const [showAllUsers, setShowAllUsers] = useState(false);
    const [expandedAnnotations, setExpandedAnnotations] = useState({});

    // 🔥 Загружаем данные выбранного пользователя
    const {
        albums: userAlbums,
        isLoading: albumsLoading
    } = useUserAlbums(selectedUser?.id);

    // 👇 Загружаем аннотации + тексты песен для фрагментов
    const {
        annotations: userAnnotations,
        isLoading: annotationsLoading
    } = useUserAnnotations(selectedUser?.id, { withLyricsText: true });

    // 🔥 Мутации
    const blockUserMutation = useBlockUser();
    const approveAnnotationMutation = useApproveAnnotation();  // 👈 Новые мутации
    const rejectAnnotationMutation = useRejectAnnotation();

    // 🔥 Сводные состояния
    const isLoading = usersLoading || albumsLoading || annotationsLoading;
    const isMutating =
        blockUserMutation.isPending ||
        approveAnnotationMutation.isPending ||
        rejectAnnotationMutation.isPending;

    // ===== ФИЛЬТРАЦИЯ И ПОИСК =====
    const filteredUsers = useMemo(() => {
        if (!users) return [];
        const query = userSearchQuery.toLowerCase();
        return users.filter((user) =>
            (user.login || "").toLowerCase().includes(query) ||
            (user.email || "").toLowerCase().includes(query)
        );
    }, [users, userSearchQuery]);

    const displayedUsers = showAllUsers ? filteredUsers : filteredUsers.slice(0, 5);
    const hasMoreUsers = filteredUsers.length > 5;

    // ===== УТИЛИТЫ =====
    const truncateText = (text, maxLength = 60) => {
        if (!text) return "";
        if (text.length <= maxLength) return text;
        return text.slice(0, maxLength) + "…";
    };

    const getAnnotationLyricsSnippet = (ann) => {
        const lyricsText = ann._lyricsText;
        if (lyricsText && Number.isFinite(ann.from) && Number.isFinite(ann.to)) {
            const snippet = lyricsText.slice(ann.from, ann.to).trim();
            if (snippet) {
                return `"${snippet.replace(/\s+/g, ' ')}"`;
            }
        }
        return annotationsLoading ? "Loading…" : "Text not available";
    };

    const getAnnotationSongName = (ann) => {
        if (ann._lyrics?.name) return ann._lyrics.name;
        if (ann.lyrics?.name) return ann.lyrics.name;
        if (ann.lyricsId) return `Track (${ann.lyricsId.slice(0, 6)}...)`;
        return "Unknown song";
    };

    const formatDuration = (seconds) => {
        if (seconds == null) return "--:--";
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // ===== ОБРАБОТЧИКИ =====
    const handleToggleBlockUser = async (targetUser) => {
        try {
            await blockUserMutation.mutateAsync({
                userId: targetUser.id,
                isBlocked: !targetUser.isBlocked,
            });
            if (selectedUser?.id === targetUser.id && !targetUser.isBlocked) {
                setSelectedUser(null);
            }
        } catch (e) {
            console.error("Toggle ban failed:", e);
            alert("Ban/Unban failed");
        }
    };

    //APPROVE ANNOTATION
    const handleApproveAnnotation = async (annotationId) => {
        try {
            await approveAnnotationMutation.mutateAsync(annotationId);
        } catch (e) {
            console.error("Approve annotation failed:", e);
            alert("Failed to approve annotation");
        }
    };

    //REJECT ANNOTATION
    const handleRejectAnnotation = async (annotationId) => {
        try {
            await rejectAnnotationMutation.mutateAsync(annotationId);
        } catch (e) {
            console.error("Reject annotation failed:", e);
            alert("Failed to reject annotation");
        }
    };

    // ===== ОБРАБОТКА ОШИБОК =====
    if (usersError) {
        return (
            <div className={styles.errorPage}>
                <Navbar />
                <div className={styles.errorContent}>
                    <h2>Failed to load admin panel</h2>
                    <p>Please check your permissions and try again</p>
                    <button onClick={() => navigate(-1)}>Go Back</button>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.page}>
            <Navbar />

            {/* ADMIN HERO */}
            <div className={styles.adminHero}>
                <div className={styles.heroContent}>
                    <h1 className={styles.heroTitle}>Admin Panel</h1>
                    <div className={styles.stats}>
                        <div className={styles.statCard}>
                            <span className={styles.statNumber}>
                                {usersLoading ? "…" : users?.length || 0}
                            </span>
                            <span className={styles.statLabel}>Users</span>
                        </div>
                        <div className={styles.statCard}>
                            <span className={styles.statNumber}>
                                {annotationsLoading ? "…" : userAnnotations?.length || 0}
                            </span>
                            <span className={styles.statLabel}>Annotations</span>
                        </div>
                        <div className={styles.statCard}>
                            <span className={styles.statNumber}>
                                {albumsLoading ? "…" : userAlbums?.length || 0}
                            </span>
                            <span className={styles.statLabel}>Albums</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className={styles.contentWrapper}>
                {/* ===== USERS COLUMN ===== */}
                <div className={styles.column}>
                    <div className={styles.sectionHeader}>
                        <h2 className={styles.sectionTitle}>Users</h2>
                        <input
                            type="text"
                            className={styles.searchInput}
                            placeholder="Search users..."
                            value={userSearchQuery}
                            onChange={(e) => {
                                setUserSearchQuery(e.target.value);
                                setShowAllUsers(false);
                            }}
                            disabled={usersLoading}
                        />
                    </div>

                    <div className={styles.userList}>
                        {usersLoading ? (
                            <div className={styles.emptyState}>Loading users…</div>
                        ) : filteredUsers.length === 0 ? (
                            <div className={styles.emptyState}>
                                <span className={styles.emptyIcon}>🔍</span>
                                <p>No users found for "{userSearchQuery}"</p>
                            </div>
                        ) : (
                            displayedUsers.map((user) => (
                                <div
                                    key={user.id}
                                    className={`${styles.userCard} ${selectedUser?.id === user.id ? styles.selected : ""}`}
                                >
                                    <div className={styles.userInfo}>
                                        <div className={styles.userAvatar}>
                                            {(user.login || "").charAt(0).toUpperCase()}
                                        </div>
                                        <div className={styles.userDetails}>
                                            <div className={styles.userLogin}>{user.login}</div>
                                            <div className={styles.userEmail}>{user.email}</div>
                                            <div className={styles.userMeta}>
                                                <span className={`${styles.statusBadge} ${styles[user.isBlocked ? "banned" : "active"]}`}>
                                                    {user.isBlocked ? "banned" : "active"}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className={styles.userActions}>
                                        <button
                                            className={`${styles.actionBtn} ${styles.banBtn}`}
                                            onClick={() => handleToggleBlockUser(user)}
                                            disabled={isMutating || blockUserMutation.isPending}
                                            title={user.isBlocked ? "BANNED" : "BAN"}
                                        >
                                            {blockUserMutation.isPending && selectedUser?.id === user.id
                                                ? "⏳"
                                                : user.isBlocked ? "BANNED" : "BAN"}
                                        </button>
                                        <button
                                            className={`${styles.actionBtn} ${styles.selectBtn}`}
                                            onClick={() => setSelectedUser(user)}
                                            disabled={isMutating}
                                            title="View details"
                                        >
                                            👁
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {hasMoreUsers && !showAllUsers && (
                        <button
                            className={styles.showAllButton}
                            onClick={() => setShowAllUsers(true)}
                            disabled={usersLoading}
                        >
                            Show all ({filteredUsers.length})
                        </button>
                    )}
                    {showAllUsers && (
                        <button
                            className={styles.showAllButton}
                            onClick={() => setShowAllUsers(false)}
                            disabled={usersLoading}
                        >
                            Show less
                        </button>
                    )}
                </div>

                {/* ===== ANNOTATIONS COLUMN — С КНОПКАМИ МОДЕРАЦИИ ===== */}
                <div className={styles.column}>
                    <div className={styles.sectionHeader}>
                        <h2 className={styles.sectionTitle}>Annotations</h2>
                        {selectedUser && (
                            <span className={styles.sectionCount}>
                                {annotationsLoading ? "…" : userAnnotations?.length || 0}
                            </span>
                        )}
                    </div>

                    <div className={styles.annotationList}>
                        {!selectedUser ? (
                            <div className={styles.emptyState}>
                                <p>Select a user to view their annotations</p>
                            </div>
                        ) : annotationsLoading ? (
                            <div className={styles.emptyState}>Loading…</div>
                        ) : !userAnnotations?.length ? (
                            <div className={styles.emptyState}>
                                <span className={styles.emptyIcon}>💬</span>
                                <p>No annotations from this user</p>
                            </div>
                        ) : (
                            userAnnotations.map((ann) => {
                                const songName = getAnnotationSongName(ann);
                                const lyricsSnippet = getAnnotationLyricsSnippet(ann);
                                const annotationText = ann.text || ann.annotationText || "";
                                const isExpanded = expandedAnnotations[ann.id];
                                const displayText = isExpanded ? annotationText : truncateText(annotationText);
                                const hasMoreText = annotationText.length > 60;
                                const status = ann.isVerified ? "approved" : ann.isRejected ? "rejected" : "pending";

                                return (
                                    <div key={ann.id} className={`${styles.annotationCard} ${styles[status]}`}>
                                        <div className={styles.annotationHeader}>
                                            <div className={styles.annotationSong}>
                                                <span className={styles.songNameText}>{songName}</span>
                                            </div>
                                            <span className={`${styles.statusBadge} ${styles[status]}`}>
                                                {status}
                                            </span>
                                        </div>

                                        <div className={styles.annotationQuote}>
                                            <blockquote className={styles.lyricsSnippet}>
                                                {lyricsSnippet}
                                            </blockquote>
                                        </div>

                                        <div className={styles.annotationText}>
                                            {displayText || <span className={styles.noText}>No annotation text</span>}
                                        </div>

                                        {hasMoreText && (
                                            <button
                                                className={styles.showMoreBtn}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setExpandedAnnotations((prev) => ({
                                                        ...prev,
                                                        [ann.id]: !prev[ann.id]
                                                    }));
                                                }}
                                            >
                                                {isExpanded ? "Show less" : "Show more"}
                                            </button>
                                        )}

                                        {/* КНОПКИ МОДЕРАЦИИ — только для pending */}
                                        {status === "pending" && (
                                            <div className={styles.annotationActions}>
                                                <button
                                                    className={`${styles.actionBtnSmall} ${styles.approveBtn}`}
                                                    onClick={() => handleApproveAnnotation(ann.id)}
                                                    disabled={isMutating || approveAnnotationMutation.isPending}
                                                >
                                                    {approveAnnotationMutation.isPending ? "⏳" : "Approve"}
                                                </button>
                                                <button
                                                    className={`${styles.actionBtnSmall} ${styles.rejectBtn}`}
                                                    onClick={() => handleRejectAnnotation(ann.id)}
                                                    disabled={isMutating || rejectAnnotationMutation.isPending}
                                                >
                                                    {rejectAnnotationMutation.isPending ? "⏳" : "Reject"}
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* ===== ALBUMS COLUMN ===== */}
                <div className={styles.albumList}>
                    {!selectedUser ? (
                        <div className={styles.emptyState}>
                            <p>Select a user to view their albums</p>
                        </div>
                    ) : albumsLoading ? (
                        <div className={styles.emptyState}>Loading…</div>
                    ) : !userAlbums?.length ? (
                        <div className={styles.emptyState}>
                            <span className={styles.emptyIcon}>🎵</span>
                            <p>No albums from this user</p>
                        </div>
                    ) : (
                        userAlbums.map((album) => (
                            <AdminAlbumCard
                                key={album.id}
                                album={album}
                                formatDuration={formatDuration}
                                truncateText={truncateText}
                            />
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminPage;