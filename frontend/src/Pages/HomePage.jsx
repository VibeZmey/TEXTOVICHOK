// src/pages/HomePage/HomePage.jsx
import { Link } from "react-router-dom";
import { useMemo } from "react";
import styles from "./Home.module.css";

// Компоненты
import Navbar from "../Components/NavBar/NavBar.jsx";

// Хуки
import { useAllAlbums, useUser } from "../hooks";

const CDN_BASE = "http://localhost:9000";

/**
 * Главная страница: список всех альбомов.
 * Использует React Query для кэширования альбомов и артистов.
 */
const HomePage = () => {
    const {
        albums = [],
        isLoading,
        isError,
        error,
        refetch
    } = useAllAlbums();

    const popularAlbums = useMemo(() => albums.slice(0, 6), [albums]);
    const trendingAlbums = useMemo(() => albums.slice(0, 4), [albums]);

    if (isError) {
        return (
            <div className={styles.errorPage}>
                <Navbar />
                <div className={styles.errorContent}>
                    <h2>Failed to load albums</h2>
                    <p>{error?.message || "Please try again later"}</p>
                    <button onClick={() => refetch()} className={styles.retryButton}>
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.page}>
            <Navbar />

            <div className={styles.hero}>
                <div className={styles.heroContent}>
                    <h1 className={styles.heroTitle}>Discover Music</h1>
                    <p className={styles.heroSubtitle}>
                        Explore albums, read lyrics, and share your thoughts
                    </p>
                </div>
                <div className={styles.heroAccent} />
            </div>

            <div className={styles.contentWrapper}>
                <div className={styles.sectionHeader}>
                    <h2 className={styles.sectionTitle}>Popular Albums</h2>
                </div>

                <div className={styles.columnsGrid}>
                    {/* MAIN COLUMN */}
                    <div className={styles.column}>
                        {isLoading ? (
                            <div className={styles.emptyState}>Loading albums...</div>
                        ) : popularAlbums.length === 0 ? (
                            <div className={styles.emptyState}>No albums yet</div>
                        ) : (
                            <div className={styles.albumGrid}>
                                {popularAlbums.map((album) => (
                                    <AlbumCard key={album.id} album={album} />
                                ))}
                            </div>
                        )}
                    </div>

                    {/* SIDEBAR */}
                    <div className={styles.sidebar}>
                        {/* TRENDING */}
                        <div className={styles.sidebarSection}>
                            <h3 className={styles.sidebarTitle}>Trending Now</h3>
                            {isLoading ? (
                                <div className={styles.emptyState}>Loading...</div>
                            ) : trendingAlbums.length === 0 ? (
                                <div className={styles.emptyState}>No trending albums</div>
                            ) : (
                                <div className={styles.trendingList}>
                                    {trendingAlbums.map((album, idx) => (
                                        <TrendingItem key={album.id} album={album} rank={idx + 1} />
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* GENRES */}
                        <div className={styles.sidebarSection}>
                            <h3 className={styles.sidebarTitle}>Genres</h3>
                            <div className={styles.genreTags}>
                                {["Rock", "Pop", "Hip-Hop", "Electronic", "Jazz", "R&B"].map(
                                    (genre) => (
                                        <span key={genre} className={styles.genreTag}>
                      {genre}
                    </span>
                                    )
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ===== Вынесенные компоненты =====

/**
 * Карточка альбома с подгрузкой имени артиста.
 * @param {Object} props
 * @param {import('../../types/models').Album} props.album
 */
const AlbumCard = ({ album }) => {

    const {  data: artist, isLoading, error, isFetching } = useUser(album.userId);

    const artistName = useMemo(() => {
        if (isLoading || isFetching) return "Loading...";
        if (error) {
            console.warn(`Failed to load artist ${album.userId}:`, error);
            return "Unknown Artist";
        }
        return artist?.login || "Unknown Artist";
    }, [artist, isLoading, isFetching, error, album.userId]);

    const coverUrl = album.imageUrl ? `${CDN_BASE}/${album.imageUrl}` : null;

    return (
        <Link to={`/album/${album.id}`} className={styles.albumCard}>
            <div className={styles.albumCoverWrapper}>
                {coverUrl ? (
                    <img
                        src={coverUrl}
                        alt={album.name || album.title}
                        className={styles.albumCover}
                        loading="lazy"
                    />
                ) : (
                    <div className={styles.albumCoverPlaceholder}>
                        <span className={styles.coverIcon}>🎵</span>
                    </div>
                )}
                <div className={styles.playOverlay}>
                    <span className={styles.playIcon}>▶</span>
                </div>
            </div>
            <h3 className={styles.albumName}>{album.name || album.title}</h3>
            <p className={styles.albumArtist}>{artistName}</p>
        </Link>
    );
};

/**
 * Элемент трендов в сайдбаре.
 * @param {Object} props
 * @param {import('../../types/models').Album} props.album
 * @param {number} props.rank
 */
const TrendingItem = ({ album, rank }) => {
    // 🔥 Аналогично подгружаем артиста для трендов
    const {  data: artist, isLoading, error, isFetching } = useUser(album.userId);

    const artistName = useMemo(() => {
        if (isLoading || isFetching) return "Loading...";
        if (error) {
            console.warn(`Failed to load artist ${album.userId}:`, error);
            return "Unknown Artist";
        }
        return artist?.login || "Unknown Artist";
    }, [artist, isLoading, isFetching, error, album.userId]);

    return (
        <Link to={`/album/${album.id}`} className={styles.trendingItem}>
            <span className={styles.trendingRank}>{rank}</span>
            <div className={styles.trendingInfo}>
                <div className={styles.trendingName}>{album.name || album.title}</div>
                <div className={styles.trendingArtist}>{artistName}</div>
            </div>
        </Link>
    );
};

export default HomePage;