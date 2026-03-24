import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import styles from "./AdminPage.module.css";
import SearchBar from "../Components/SearchBar/SearchBar.jsx";
import { userService, annotationService, albumService } from "../api/apiService";
import Navbar from "../Components/NavBar/NavBar.jsx";

const AdminPage = () => {
    const navigate = useNavigate();

    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [userAlbums, setUserAlbums] = useState([]);
    const [userAnnotations, setUserAnnotations] = useState([]);
    const [userSearchQuery, setUserSearchQuery] = useState("");
    const [showAllUsers, setShowAllUsers] = useState(false);
    const [expandedAnnotations, setExpandedAnnotations] = useState({});
    const [loading, setLoading] = useState(true);
    const [loadingUser, setLoadingUser] = useState(false);

    const reloadUsers = async () => {
        const res = await userService.getAllUsers();
        setUsers(Array.isArray(res.data) ? res.data : []);
        return res.data || [];
    };

    const loadSelectedUserData = async (userId) => {
        const [albumsRes, annsRes] = await Promise.all([
            userService.getUserAlbums(userId),
            userService.getUserAnnotations(userId),
        ]);
        setUserAlbums(Array.isArray(albumsRes.data) ? albumsRes.data : []);
        console.log("user annotations response:", annsRes.data);
        setUserAnnotations(Array.isArray(annsRes.data) ? annsRes.data : []);
    };

    useEffect(() => {
        const init = async () => {
            setLoading(true);
            try {
                await reloadUsers();
            } catch (e) {
                console.error("Failed to load users:", e?.response?.data || e);
                setUsers([]);
            } finally {
                setLoading(false);
            }
        };
        init();
    }, []);

    const handleSelectUser = async (user) => {
        setLoadingUser(true);
        setSelectedUser(user);
        try {
            await loadSelectedUserData(user.id);
        } catch (e) {
            console.error("Failed to load selected user data:", e?.response?.data || e);
            setUserAlbums([]);
            setUserAnnotations([]);
        } finally {
            setLoadingUser(false);
        }
    };

    const filteredUsers = users.filter((user) =>
        (user.login || "").toLowerCase().includes(userSearchQuery.toLowerCase()) ||
        (user.email || "").toLowerCase().includes(userSearchQuery.toLowerCase())
    );

    const displayedUsers = showAllUsers ? filteredUsers : filteredUsers.slice(0, 5);
    const hasMoreUsers = filteredUsers.length > 5;

    // Ban/Unban toggle
    const handleToggleBlockUser = async (targetUser) => {
        try {
            // попытка toggle через block endpoint
            await userService.blockUser(targetUser.id);

            let updatedUsers = await reloadUsers();
            let fresh = updatedUsers.find((u) => u.id === targetUser.id);

            // если состояние не поменялось — fallback через updateUser
            if (fresh && fresh.isBlocked === targetUser.isBlocked) {
                await userService.updateUser(targetUser.id, { isBlocked: !targetUser.isBlocked });
                updatedUsers = await reloadUsers();
                fresh = updatedUsers.find((u) => u.id === targetUser.id);
            }

            if (selectedUser?.id === targetUser.id && fresh) {
                setSelectedUser(fresh);
                await loadSelectedUserData(fresh.id);
            }
        } catch (e) {
            console.error("Toggle ban/unban failed:", e?.response?.data || e);
            alert("Ban/Unban failed");
        }
    };

    // Аннотации: approve/reject
    const handleApproveAnnotation = async (annotationId) => {
        if (!selectedUser) return;

        try {
            try {
                await annotationService.verify(annotationId);
            } catch (e1) {
                console.warn("Verify endpoint failed, fallback to update:", e1?.response?.data || e1);
                await annotationService.update(annotationId, { status: "approved", isVerified: true });
            }

            await loadSelectedUserData(selectedUser.id);
        } catch (e) {
            console.error("Approve annotation failed:", e?.response?.data || e);
            alert("Failed to approve annotation");
        }
    };

    const handleRejectAnnotation = async (annotationId) => {
        if (!selectedUser) return;

        try {
            try {
                await annotationService.reject(annotationId);
            } catch (e1) {
                console.warn("Reject endpoint failed, fallback to update:", e1?.response?.data || e1);
                await annotationService.update(annotationId, { status: "rejected", isRejected: true });
            }

            await loadSelectedUserData(selectedUser.id);
        } catch (e) {
            console.error("Reject annotation failed:", e?.response?.data || e);
            alert("Failed to reject annotation");
        }
    };

    // Альбомы: approve/reject
    const handleApproveAlbum = async (albumId) => {
        if (!selectedUser) return;
        try {
            await albumService.update(albumId, { status: "approved" });
            await loadSelectedUserData(selectedUser.id);
        } catch (e) {
            console.error("Approve album failed:", e?.response?.data || e);
            alert("Failed to approve album");
        }
    };

    const handleRejectAlbum = async (albumId) => {
        if (!selectedUser) return;
        try {
            await albumService.update(albumId, { status: "rejected" });
            await loadSelectedUserData(selectedUser.id);
        } catch (e) {
            console.error("Reject album failed:", e?.response?.data || e);
            alert("Failed to reject album");
        }
    };

    const truncateText = (text, maxLength = 60) => {
        if (!text) return "";
        if (text.length <= maxLength) return text;
        return text.slice(0, maxLength) + "...";
    };

    const resolveAnnotationStatus = (ann) => {
        if (ann?.isVerified === true) return "approved";
        if (ann?.isRejected === true) return "rejected";
        return (ann?.status || "pending").toLowerCase();
    };

    const getAnnotationSong = (ann) => ann.lyrics;

    const pendingAnnotations = userAnnotations.filter(
        (a) => resolveAnnotationStatus(a) === "pending"
    ).length;

    const pendingAlbums = userAlbums.filter(
        (a) => (a.status || "pending").toLowerCase() === "pending"
    ).length;

    return (
        <div className={styles.page}>
            <Navbar/>

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

            <div className={styles.contentWrapper}>
                {/* USERS */}
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
                        />
                    </div>

                    <div className={styles.userList}>
                        {loading ? (
                            <div>Loading...</div>
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
                                                <span className={`${styles.roleBadge} ${styles[user.role?.toLowerCase()]}`}>
                                                    {user.role}
                                                </span>
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
                                            title={user.isBlocked ? "Unban" : "Ban"}
                                        >
                                            {user.isBlocked ? "Unban" : "Ban"}
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

                    {hasMoreUsers && !showAllUsers && (
                        <button className={styles.showAllButton} onClick={() => setShowAllUsers(true)}>
                            Show all ({filteredUsers.length})
                        </button>
                    )}
                    {showAllUsers && (
                        <button className={styles.showAllButton} onClick={() => setShowAllUsers(false)}>
                            Show less
                        </button>
                    )}
                </div>

                {/* ANNOTATIONS */}
                <div className={styles.column}>
                    <div className={styles.sectionHeader}>
                        <h2 className={styles.sectionTitle}>Annotations</h2>
                        {selectedUser && <span className={styles.sectionCount}>{userAnnotations.length}</span>}
                    </div>

                    <div className={styles.annotationList}>
                        {!selectedUser ? (
                            <div className={styles.emptyState}><p>Select a user to view their annotations</p></div>
                        ) : loadingUser ? (
                            <div className={styles.emptyState}>Loading...</div>
                        ) : userAnnotations.length === 0 ? (
                            <div className={styles.emptyState}>
                                <span className={styles.emptyIcon}>💬</span>
                                <p>No annotations from this user</p>
                            </div>
                        ) : (
                            userAnnotations.map((ann) => {
                                const status = resolveAnnotationStatus(ann);
                                const annotationText = ann.text || ann.annotationText || "";
                                const isExpanded = expandedAnnotations[ann.id];
                                const displayText = isExpanded ? annotationText : truncateText(annotationText);
                                const hasMoreText = annotationText.length > 60;

                                return (
                                    <div key={ann.id} className={`${styles.annotationCard} ${styles[status]}`}>
                                        <div className={styles.annotationHeader}>
                                            <div className={styles.annotationSong}>{getAnnotationSong(ann)}</div>
                                            <span className={`${styles.statusBadge} ${styles[status]}`}>{status}</span>
                                        </div>
                                        <div className={styles.annotationText}>{displayText || "No annotation text"}</div>

                                        {hasMoreText && (
                                            <button
                                                className={styles.showMoreBtn}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setExpandedAnnotations((prev) => ({ ...prev, [ann.id]: !prev[ann.id] }));
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

                {/* ALBUMS */}
                <div className={styles.column}>
                    <div className={styles.sectionHeader}>
                        <h2 className={styles.sectionTitle}>Albums</h2>
                        {selectedUser && <span className={styles.sectionCount}>{userAlbums.length}</span>}
                    </div>

                    <div className={styles.albumList}>
                        {!selectedUser ? (
                            <div className={styles.emptyState}><p>Select a user to view their albums</p></div>
                        ) : loadingUser ? (
                            <div className={styles.emptyState}>Loading...</div>
                        ) : userAlbums.length === 0 ? (
                            <div className={styles.emptyState}>
                                <span className={styles.emptyIcon}>🎵</span>
                                <p>No albums from this user</p>
                            </div>
                        ) : (
                            userAlbums.map((album) => {
                                const albumName = album.name || "Unknown Album";
                                const artist = album.artist || selectedUser?.login || "Unknown Artist";
                                const status = (album.status || "pending").toLowerCase();
                                const songs = album.songs || [];

                                return (
                                    <div key={album.id} className={`${styles.albumCard} ${styles[status]}`}>
                                        <div className={styles.albumHeader}>
                                            <div className={styles.albumCover}>
                                                {album.coverImage ? <img src={album.coverImage} alt={albumName} /> : <span>🎵</span>}
                                            </div>
                                            <div className={styles.albumInfo}>
                                                <div className={styles.albumName}>{albumName}</div>
                                                <div className={styles.albumArtist}>{artist}</div>
                                                <div className={styles.albumMeta}>
                                                    {songs.length} song{songs.length !== 1 ? "s" : ""} • {album.year || new Date().getFullYear()}
                                                </div>
                                            </div>
                                            <span className={`${styles.statusBadge} ${styles[status]}`}>{status}</span>
                                        </div>

                                        <div className={styles.songsList}>
                                            {songs.length === 0 && <div className={styles.emptySong}>No songs in this album</div>}
                                            {songs.map((song) => (
                                                <div key={song.id || song.name} className={styles.songItem}>
                                                    <div className={styles.songInfo}>
                                                        <span className={styles.songName}>{song.name}</span>
                                                        {song.year && <span className={styles.songYear}>({song.year})</span>}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

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