import { Link } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import styles from "./Home.module.css";
import Navbar from "../Components/NavBar/NavBar.jsx";
import { albumService, userService } from "../api/apiService";
const CDN_BASE = "http://localhost:9000";
const HomePage = () => {
    const [albums, setAlbums] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [artists, setArtists] = useState();

    const getArtist = async (artistId) => {
        try {
            const res = await userService.getUserById(artistId);
            
        } catch (err) {
            console.error("Failed to load artist:", err?.response?.data || err);
            return null;
        }
    };


    useEffect(() => {
        const loadAlbums = async () => {
            setLoading(true);
            setError("");
            try {
                const res = await albumService.getAll();
                setAlbums(Array.isArray(res.data) ? res.data : []);
            } catch (err) {
                console.error("Failed to load albums:", err?.response?.data || err);
                setError("Failed to load albums");
                setAlbums([]);
            } finally {
                setLoading(false);
            }
        };

        loadAlbums();
    }, []);

    const popularAlbums = useMemo(() => albums.slice(0, 6), [albums]);
    const trendingAlbums = useMemo(() => albums.slice(0, 4), [albums]);

    return (
        <div className={styles.page}>
            <Navbar />

            <div className={styles.hero}>
                <div className={styles.heroContent}>
                    <h1 className={styles.heroTitle}>Discover Music</h1>
                    <p className={styles.heroSubtitle}>Explore albums, read lyrics, and share your thoughts</p>
                </div>
                <div className={styles.heroAccent} />
            </div>

            <div className={styles.contentWrapper}>
                <div className={styles.sectionHeader}>
                    <h2 className={styles.sectionTitle}>Popular Albums</h2>
                </div>

                <div className={styles.columnsGrid}>
                    <div className={styles.column}>
                        {loading ? (
                            <div className={styles.emptyState}>Loading albums...</div>
                        ) : error ? (
                            <div className={styles.emptyState}>{error}</div>
                        ) : popularAlbums.length === 0 ? (
                            <div className={styles.emptyState}>No albums yet</div>
                        ) : (
                            <div className={styles.albumGrid}>
                                {popularAlbums.map((album) => (
                                    <Link key={album.id} to={`/album/${album.id}`} className={styles.albumCard}>
                                        <div className={styles.albumCoverWrapper}>
                                            {album.imageUrl ? (
                                                <img src={`${CDN_BASE}/${album.imageUrl}`} alt={album.name || album.title} className={styles.albumCover} />
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
                                        <p className={styles.albumArtist}>{ getArtist(album.userId).login || "Unknown Artist"}</p>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className={styles.sidebar}>
                        <div className={styles.sidebarSection}>
                            <h3 className={styles.sidebarTitle}>Trending Now</h3>
                            {loading ? (
                                <div className={styles.emptyState}>Loading...</div>
                            ) : trendingAlbums.length === 0 ? (
                                <div className={styles.emptyState}>No trending albums</div>
                            ) : (
                                <div className={styles.trendingList}>
                                    {trendingAlbums.map((album, idx) => (
                                        <Link key={album.id} to={`/album/${album.id}`} className={styles.trendingItem}>
                                            <span className={styles.trendingRank}>{idx + 1}</span>
                                            <div className={styles.trendingInfo}>
                                                <div className={styles.trendingName}>{album.name || album.title}</div>
                                                <div className={styles.trendingArtist}>{album.artist || "Unknown"}</div>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className={styles.sidebarSection}>
                            <h3 className={styles.sidebarTitle}>Genres</h3>
                            <div className={styles.genreTags}>
                                {["Rock", "Pop", "Hip-Hop", "Electronic", "Jazz", "R&B"].map((genre) => (
                                    <span key={genre} className={styles.genreTag}>{genre}</span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HomePage;