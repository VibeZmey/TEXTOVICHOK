import {useEffect, useState} from "react";
import { Link, useNavigate} from "react-router-dom";
import styles from "./AdminPage.module.css";
import SearchBar from "../Components/SearchBar/SearchBar.jsx";
import { mockUsers } from "../data/mockData";


const ANNOTATIONS_STORAGE_PREFIX = "mock_annotations_";

const AdminPage = () => {

    const navigate = useNavigate();

    const [users, setUsers] = useState(mockUsers);

    const [selectedUser, setSelectedUser] = useState(null);
    const [activeTab, setActiveTab] = useState("users");

    const [showAllUsers, setShowAllUsers] = useState(false);
    const [userSearchQuery, setUserSearchQuery] = useState("");

    const [expandedAnnotations, setExpandedAnnotations] = useState({});



    // ===== USER ACTIONS =====
    const handleSelectUser = (user) => {
        setSelectedUser(user);
        setActiveTab("annotations");
    };

    const filteredUsers = users.filter((user) =>
        user.login.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(userSearchQuery.toLowerCase())
    );

    const handleBanUser = (userId) => {
        const updated = users.map((u) =>
            u.id === userId ? { ...u, status: u.status === "banned" ? "active" : "banned" } : u
        );
        setUsers(updated);
        if (selectedUser?.id === userId) {
            setSelectedUser((prev) => ({
                ...prev,
                status: prev.status === "banned" ? "active" : "banned",
            }));
        }
    };

    const toggleAnnotationExpand = (annotationId) => {
        setExpandedAnnotations((prev) => ({
            ...prev,
            [annotationId]: !prev[annotationId],
        }));
    };

    const displayedUsers = showAllUsers ? filteredUsers : filteredUsers.slice(0, 5);
    const hasMoreUsers = filteredUsers.length > 1;

    // ===== ANNOTATION ACTIONS =====

    const getAnnotationsForUserFromStorage = (userId) => {
        const albums = getAlbumsFromStorage();
        const allAnnotations = [];

        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key?.startsWith("mock_annotations_")) {
                try {
                    const raw = localStorage.getItem(key);
                    const annotations = raw ? JSON.parse(raw) : [];
                    if (Array.isArray(annotations)) {
                        const userAnns = annotations
                            .filter(ann => ann.userId === userId)
                            .map(ann => {
                                const { songName, albumName, albumId, lyricSnippet } =
                                    findSongByLyricsId(ann.lyricsId, albums);

                                return {
                                    ...ann,
                                    songName,
                                    albumName,
                                    albumId,
                                    lyricSnippet: ann.lyricSnippet || lyricSnippet,
                                };
                            });
                        allAnnotations.push(...userAnns);
                    }
                } catch (e) {
                    console.error("Failed to parse annotations from", key, e);
                }
            }
        }
        return allAnnotations;
    };

    // ===== ANNOTATION ACTIONS (универсальные) =====

    const handleApproveAnnotation = (annotationId) => {
        let found = false;

        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key?.startsWith("mock_annotations_")) {
                try {
                    const raw = localStorage.getItem(key);
                    const annotations = raw ? JSON.parse(raw) : [];

                    // ← ИСПРАВЛЕНО: проверяем, была ли найдена аннотация
                    const updated = annotations.map((a) => {
                        if (a.id === annotationId) {
                            found = true;
                            return {
                                ...a,
                                status: "approved",
                                isVerified: true,
                                updatedAt: new Date().toISOString()
                            };
                        }
                        return a;
                    });

                    // ← ИСПРАВЛЕНО: сохраняем, если нашли аннотацию
                    if (found) {
                        localStorage.setItem(key, JSON.stringify(updated));
                    }
                } catch (e) {
                    console.error("Failed to update in", key, e);
                }
            }
        }
        if (selectedUser) {
            setSelectedUser((prev) => ({
                ...prev,
                annotations: prev.annotations.map((a) =>
                    a.id === annotationId ? { ...a, status: "approved", isVerified: true } : a
                ),
            }));
        }

        if (found) {
            window.dispatchEvent(new Event("storage-sync"));
        }
    };

    const handleRejectAnnotation = (annotationId) => {
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key?.startsWith("mock_annotations_")) {
                try {
                    const raw = localStorage.getItem(key);
                    const annotations = raw ? JSON.parse(raw) : [];
                    const updated = annotations.map((a) =>
                        a.id === annotationId
                            ? { ...a, status: "rejected", isVerified: false, updatedAt: new Date().toISOString() }
                            : a
                    );
                    localStorage.setItem(key, JSON.stringify(updated));
                } catch (e) {
                    console.error("Failed to update in", key, e);
                }
            }
        }
        if (selectedUser) {
            setSelectedUser((prev) => ({
                ...prev,
                annotations: prev.annotations.filter((a) => a.id !== annotationId),
            }));
        }
        window.dispatchEvent(new Event("storage-sync"));
    };

    // ===== ALBUM ACTIONS =====

    const getAlbumsFromStorage = () => {
        try {
            const raw = localStorage.getItem("mock_user_albums");
            return raw ? JSON.parse(raw) : [];
        } catch (e) {
            console.error("Failed to load albums from storage", e);
            return [];
        }
    };

    const getAlbumsForUserFromStorage = (userId) => {
        const allAlbums = getAlbumsFromStorage();
        return allAlbums.filter(album => album.userId === userId || album.artist === userId || !album.userId);
    };

    const findSongByLyricsId = (lyricsId, albums) => {
        for (const album of albums) {
            const song = album.songs?.find(s => s.id === lyricsId);
            if (song) {
                return {
                    song,
                    album,
                    songName: song.name,
                    albumName: album.name,
                    albumId: album.id,
                    lyricSnippet: song.text?.slice(0, 50) || "...",
                };
            }
        }
        return {
            song: null,
            album: null,
            songName: "Unknown Song",
            albumName: "Unknown Album",
            albumId: null,
            lyricSnippet: "...",
        };
    };

    const updateAlbumInStorage = (albumId, updates) => {
        try {
            const raw = localStorage.getItem("mock_user_albums");
            const albums = raw ? JSON.parse(raw) : [];
            const updated = albums.map((a) =>
                a.id === albumId ? { ...a, ...updates, updatedAt: new Date().toISOString() } : a
            );
            localStorage.setItem("mock_user_albums", JSON.stringify(updated));
            return true;
        } catch (e) {
            console.error("Failed to update album in storage", e);
            return false;
        }
    };

    const handleApproveAlbum = (albumId) => {
        // 1. Обновляем в localStorage
        const updated = updateAlbumInStorage(albumId, { status: "approved" });

        // 2. Обновляем локальный стейт для мгновенного UI
        if (updated && selectedUser) {
            setSelectedUser((prev) => ({
                ...prev,
                albums: prev.albums.map((a) =>
                    a.id === albumId ? { ...a, status: "approved" } : a
                ),
            }));
        }

        // 3. Триггерим событие синхронизации
        if (updated) {
            window.dispatchEvent(new Event("storage-sync"));
        }
    };

    const truncateText = (text, maxLength = 30) => {
        if (!text) return "";
        if (text.length <= maxLength) return text;
        return text.slice(0, maxLength) + "...";
    };

    const handleRejectAlbum = (albumId) => {
        updateAlbumInStorage(albumId, { status: "rejected" });

        if (selectedUser) {
            setSelectedUser((prev) => ({
                ...prev,
                albums: prev.albums.filter((a) => a.id !== albumId),
            }));
        }

        // 3. Триггерим событие
        window.dispatchEvent(new Event("storage-sync"));
    };

    // ===== SONG ACTIONS =====
    // ===== SONG ACTIONS (с работой через localStorage) =====

    const handleApproveSong = (albumId, songId) => {
        // Обновляем статус песни внутри альбома в localStorage
        try {
            const raw = localStorage.getItem("mock_user_albums");
            const albums = raw ? JSON.parse(raw) : [];
            const updated = albums.map((a) => {
                if (a.id === albumId) {
                    return {
                        ...a,
                        songs: a.songs?.map((s) =>
                            s.id === songId ? { ...s, status: "approved" } : s
                        ) || [],
                    };
                }
                return a;
            });
            localStorage.setItem("mock_user_albums", JSON.stringify(updated));

            // Обновляем локальный стейт
            if (selectedUser) {
                setSelectedUser((prev) => ({
                    ...prev,
                    albums: prev.albums.map((a) =>
                        a.id === albumId
                            ? {
                                ...a,
                                songs: a.songs?.map((s) =>
                                    s.id === songId ? { ...s, status: "approved" } : s
                                ) || [],
                            }
                            : a
                    ),
                }));
            }

            window.dispatchEvent(new Event("storage-sync"));
        } catch (e) {
            console.error("Failed to approve song", e);
        }
    };

    const handleRejectSong = (albumId, songId) => {
        // Удаляем песню из альбома в localStorage
        try {
            const raw = localStorage.getItem("mock_user_albums");
            const albums = raw ? JSON.parse(raw) : [];
            const updated = albums.map((a) => {
                if (a.id === albumId) {
                    return {
                        ...a,
                        songs: a.songs?.filter((s) => s.id !== songId) || [],
                    };
                }
                return a;
            });
            localStorage.setItem("mock_user_albums", JSON.stringify(updated));

            // Обновляем локальный стейт
            if (selectedUser) {
                setSelectedUser((prev) => ({
                    ...prev,
                    albums: prev.albums.map((a) =>
                        a.id === albumId
                            ? {
                                ...a,
                                songs: a.songs?.filter((s) => s.id !== songId) || [],
                            }
                            : a
                    ),
                }));
            }

            window.dispatchEvent(new Event("storage-sync"));
        } catch (e) {
            console.error("Failed to reject song", e);
        }
    };

    const displayedAnnotations = selectedUser
        ? getAnnotationsForUserFromStorage(selectedUser.id)
        : [];


    const pendingAnnotations = users.reduce(
        (acc, u) => acc + u.annotations.filter((a) => a.status === "pending").length,
        0
    );
    const userAlbums = selectedUser ? getAlbumsForUserFromStorage(selectedUser.id) : [];
    const pendingAlbums = userAlbums.filter((a) => a.status === "pending").length;
    const displayedAlbums = selectedUser
        ? getAlbumsForUserFromStorage(selectedUser.id)
        : [];

    // ===== СИНХРОНИЗАЦИЯ С PROFILE PAGE =====

    useEffect(() => {
        const handleStorageChange = (e) => {
            if (e.key?.startsWith(ANNOTATIONS_STORAGE_PREFIX) || e.type === "storage-sync") {
                if (selectedUser) {
                    const allAnnotations = getAnnotationsForUserFromStorage(selectedUser.id);
                    const userAnnotations = allAnnotations.filter(
                        (a) => a.userId === selectedUser.id
                    );
                    setSelectedUser((prev) => ({
                        ...prev,
                        annotations: userAnnotations,
                    }));
                }
            }
            if (e.key === "mock_user_albums" || e.type === "storage-sync") {
                if (selectedUser) {
                    const albums = getAlbumsForUserFromStorage(selectedUser.id);
                    setSelectedUser((prev) => ({
                        ...prev,
                        albums,
                    }));
                }
            }
        };
        window.addEventListener("storage", handleStorageChange);
        window.addEventListener("storage-sync", handleStorageChange);

        return () => {
            window.removeEventListener("storage", handleStorageChange);
            window.removeEventListener("storage-sync", handleStorageChange);
        };
    }, [selectedUser]);

    useEffect(() => {
        if (selectedUser) {
            // Принудительно перезагружаем альбомы и аннотации для нового пользователя
            const albums = getAlbumsForUserFromStorage(selectedUser.id, selectedUser.login);
            const annotations = getAnnotationsForUserFromStorage(selectedUser.id);

            setSelectedUser((prev) => ({
                ...prev,
                albums,      // ← Перезаписываем
                annotations, // ← Перезаписываем
            }));
        }
    }, [selectedUser?.id]);

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
                <Link className={styles.navRight} to="/profile">Profile</Link>
            </div>

            {/* HEADER */}
            <div className={styles.adminHero}>
                <div className={styles.heroContent}>
                    <h1 className={styles.heroTitle}>Admin Panel</h1>
                    <div className={styles.stats}>
                        <div className={styles.statCard}>
                            <span className={styles.statNumber}>{users.length}</span>
                            <span className={styles.statLabel}>Users</span>
                        </div>
                        <div className={styles.statCard}>
                            <span className={styles.statNumber}>{pendingAnnotations}</span>
                            <span className={styles.statLabel}>Pending Annotations</span>
                        </div>
                        <div className={styles.statCard}>
                            <span className={styles.statNumber}>{pendingAlbums}</span>
                            <span className={styles.statLabel}>Pending Albums</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* MAIN CONTENT - THREE COLUMNS */}
            <div className={styles.contentWrapper}>
                {/* SECTION 1 - USERS */}
                <div className={styles.column}>
                    <div className={styles.sectionHeader}>
                        <h2 className={styles.sectionTitle}>Users</h2>
                        {/* ← Поиск вместо числа пользователей */}
                        <input
                            type="text"
                            className={styles.searchInput}
                            placeholder="Search users..."
                            value={userSearchQuery}
                            onChange={(e) => {
                                setUserSearchQuery(e.target.value);
                                setShowAllUsers(false); // Сбрасываем при поиске
                            }}
                        />
                    </div>

                    <div className={styles.userList}>
                        {filteredUsers.length === 0 ? (
                            <div className={styles.emptyState}>
                                <span className={styles.emptyIcon}>🔍</span>
                                <p>No users found for "{userSearchQuery}"</p>
                            </div>
                        ) : (
                            displayedUsers.map((user) => (
                                <div
                                    key={user.id}
                                    className={`${styles.userCard} ${
                                        selectedUser?.id === user.id ? styles.selected : ""
                                    }`}
                                >
                                    <div className={styles.userInfo}>
                                        <div className={styles.userAvatar}>
                                            {user.login.charAt(0).toUpperCase()}
                                        </div>
                                        <div className={styles.userDetails}>
                                            <div className={styles.userLogin}>{user.login}</div>
                                            <div className={styles.userEmail}>{user.email}</div>
                                            <div className={styles.userMeta}>
                                <span
                                    className={`${styles.roleBadge} ${
                                        styles[user.role.toLowerCase()]
                                    }`}
                                >
                                    {user.role}
                                </span>
                                                <span
                                                    className={`${styles.statusBadge} ${
                                                        styles[user.status]
                                                    }`}
                                                >
                                    {user.status}
                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className={styles.userActions}>
                                        <button
                                            className={`${styles.actionBtn} ${styles.banBtn}`}
                                            onClick={() => handleBanUser(user.id)}
                                            title={user.status === "banned" ? "Unban" : "Ban"}
                                        >
                                            {user.status === "banned" ? "✓" : "Delete"}
                                        </button>
                                        <button
                                            className={`${styles.actionBtn} ${styles.selectBtn}`}
                                            onClick={() => handleSelectUser(user)}
                                            title="Select"
                                        >
                                            👁
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* ← Кнопка "Показать всех" */}
                    {hasMoreUsers && !showAllUsers && (
                        <button
                            className={styles.showAllButton}
                            onClick={() => setShowAllUsers(true)}
                        >
                            Show all ({filteredUsers.length})
                        </button>
                    )}

                    {/* ← Кнопка "Скрыть" если показаны все */}
                    {showAllUsers && (
                        <button
                            className={styles.showAllButton}
                            onClick={() => setShowAllUsers(false)}
                        >
                            Show less
                        </button>
                    )}
                </div>

                {/* SECTION 2 - ANNOTATIONS */}
                <div className={styles.column}>
                    <div className={styles.sectionHeader}>
                        <h2 className={styles.sectionTitle}>Annotations</h2>
                        {selectedUser && (
                            <span className={styles.sectionCount}>
                                {displayedAnnotations.length}
                            </span>
                        )}
                    </div>
                    <div className={styles.annotationList}>
                        {!selectedUser ? (
                            <div className={styles.emptyState}>
                                <p>Select a user to view their annotations</p>
                            </div>
                        ) : displayedAnnotations.length === 0 ? (
                            <div className={styles.emptyState}>
                                <span className={styles.emptyIcon}>💬</span>
                                <p>No annotations from this user</p>
                            </div>
                        ) : (
                            displayedAnnotations.map((ann) => {
                                    // Нормализация данных
                                    const songName = ann.songName || "Unknown Song";
                                    const albumName = ann.albumName || "Unknown Album";
                                    const lyricSnippet = ann.lyricSnippet || ann.text?.slice(0, 50) || "No snippet";
                                    const annotationText = ann.text || ann.annotationText || "No text"; // ← Приоритет полю `text`

                                    const status = ann.status || "pending";
                                    const isExpanded = expandedAnnotations[ann.id];
                                    const displayText = isExpanded ? annotationText : truncateText(annotationText);
                                    const hasMoreText = annotationText.length > 30;

                                    return (
                                        <div
                                            key={ann.id}
                                            className={`${styles.annotationCard} ${styles[status]}`}
                                        >
                                            <div className={styles.annotationHeader}>
                                                {/* Название песни */}
                                                <div className={styles.annotationSong}>{songName}</div>
                                                <span className={`${styles.statusBadge} ${styles[status]}`}>
                                                    {status}
                                                </span>
                                            </div>

                                            {/* Название альбома */}
                                            <div className={styles.annotationAlbum} style={{ fontSize: 12, color: "#667788", marginBottom: 4 }}>
                                                {albumName}
                                            </div>

                                            {/* Цитата из текста песни */}
                                            <div className={styles.annotationQuote}>
                                                "{lyricSnippet}"
                                            </div>

                                            {/* Текст самой аннотации */}
                                            <div className={styles.annotationText}>
                                                {displayText}
                                            </div>

                                            {hasMoreText && (
                                                <button
                                                    className={styles.showMoreBtn}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        toggleAnnotationExpand(ann.id);
                                                    }}
                                                >
                                                    {isExpanded ? "Show less" : "Show more"}
                                                </button>
                                            )}

                                            {status === "pending" && (
                                                <div className={styles.annotationActions}>
                                                    <button
                                                        className={`${styles.actionBtnSmall} ${styles.approveBtn}`}
                                                        onClick={() => handleApproveAnnotation(ann.id)}
                                                    >
                                                        Approve
                                                    </button>
                                                    <button
                                                        className={`${styles.actionBtnSmall} ${styles.rejectBtn}`}
                                                        onClick={() => handleRejectAnnotation(ann.id)}
                                                    >
                                                        Reject
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    );
                            })
                        )}
                    </div>
                </div>

                {/* SECTION 3 - ALBUMS */}
                <div className={styles.column}>
                    <div className={styles.sectionHeader}>
                        <h2 className={styles.sectionTitle}>Albums</h2>
                        {selectedUser && (
                            <span className={styles.sectionCount}>
                                {selectedUser.albums.length}
                            </span>
                        )}
                    </div>
                    <div className={styles.albumList}>
                        {!selectedUser ? (
                            <div className={styles.emptyState}>
                                <p>Select a user to view their albums</p>
                            </div>
                        ) : displayedAlbums.length === 0 ? (
                            <div className={styles.emptyState}>
                                <span className={styles.emptyIcon}>🎵</span>
                                <p>No albums from this user</p>
                            </div>
                        ) : (
                            displayedAlbums.map((album) => {
                                // Нормализация данных
                                const albumName = album.name || "Unknown Album";
                                const artist = album.artist || selectedUser?.login || "Unknown Artist";
                                const status = album.status || "pending";
                                const songs = album.songs || [];

                                return (
                                    <div
                                        key={album.id}
                                        className={`${styles.albumCard} ${styles[status]}`}
                                    >
                                        <div className={styles.albumHeader}>
                                            <div className={styles.albumCover}>
                                                {album.coverImage ? (
                                                    <img src={album.coverImage} alt={albumName} />
                                                ) : (
                                                    <span>🎵</span>
                                                )}
                                            </div>
                                            <div className={styles.albumInfo}>
                                                <div className={styles.albumName}>{albumName}</div>
                                                <div className={styles.albumArtist}>{artist}</div>
                                                <div className={styles.albumMeta}>
                                                    {songs.length} song{songs.length !== 1 ? 's' : ''} • {album.year || new Date().getFullYear()}
                                                </div>
                                            </div>
                                            <span className={`${styles.statusBadge} ${styles[status]}`}>
                                                {status}
                                            </span>
                                        </div>

                                        {/* Songs list */}
                                        <div className={styles.songsList}>
                                            {songs.map((song) => (
                                                <div key={song.id || song.name} className={styles.songItem}>
                                                    <div className={styles.songInfo}>
                                                        <span className={styles.songName}>{song.name}</span>
                                                        {song.year && <span className={styles.songYear}>({song.year})</span>}
                                                    </div>
                                                    {/* Кнопки модерации песен (если альбом на модерации) */}
                                                    {status === "pending" && (
                                                        <div className={styles.songActions}>
                                                            <button
                                                                className={`${styles.tinyBtn} ${styles.approveBtn}`}
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleApproveSong(album.id, song.id);
                                                                }}
                                                                title="Approve song"
                                                            >
                                                                ✓
                                                            </button>
                                                            <button
                                                                className={`${styles.tinyBtn} ${styles.rejectBtn}`}
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleRejectSong(album.id, song.id);
                                                                }}
                                                                title="Reject song"
                                                            >
                                                                ✕
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                            {songs.length === 0 && (
                                                <div className={styles.emptySong}>No songs in this album</div>
                                            )}
                                        </div>

                                        {/* Кнопки модерации альбома */}
                                        {status === "pending" && (
                                            <div className={styles.albumActions}>
                                                <button
                                                    className={`${styles.actionBtnSmall} ${styles.approveBtn}`}
                                                    onClick={() => handleApproveAlbum(album.id)}
                                                >
                                                    Approve
                                                </button>
                                                <button
                                                    className={`${styles.actionBtnSmall} ${styles.rejectBtn}`}
                                                    onClick={() => handleRejectAlbum(album.id)}
                                                >
                                                    Reject
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminPage;