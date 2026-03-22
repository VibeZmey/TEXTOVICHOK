import { Link } from "react-router-dom";
import SearchBar from "../components/SearchBar/SearchBar";
import styles from "./Home.module.css";
import Navbar from "../Components/NavBar/NavBar.jsx";

const STORAGE_KEY = "mock_user_albums";

const mockAlbums = [
    { id: "1", name: "After Hours", artist: "The Weeknd", year: 2020, coverImage: "", description: "Best-selling album" },
    { id: "2", name: "DAMN.", artist: "Kendrick Lamar", year: 2017, coverImage: "", description: "Pulitzer Prize winner" },
    { id: "3", name: "Scorpion", artist: "Drake", year: 2018, coverImage: "", description: "Double album" },
    { id: "4", name: "Recovery", artist: "Eminem", year: 2010, coverImage: "", description: "Comeback album" },
];

const HomePage = () => {
    let userAlbums = [];
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        userAlbums = raw ? JSON.parse(raw) : [];
    } catch {}

    const allAlbums = [...userAlbums, ...mockAlbums.filter(m => !userAlbums.find(u => u.id === m.id))];


    return (
        <div className={styles.page}>
            {/* NAVBAR */}
            <Navbar />

            {/* HERO SECTION */}
            <div className={styles.hero}>
                <div className={styles.heroContent}>
                    <h1 className={styles.heroTitle}>Discover Music</h1>
                    <p className={styles.heroSubtitle}>Explore albums, read lyrics, and share your thoughts</p>
                </div>
                <div className={styles.heroAccent} />
            </div>

            {/* MAIN CONTENT */}
            <div className={styles.contentWrapper}>
                {/* SECTION TITLE */}
                <div className={styles.sectionHeader}>
                    <h2 className={styles.sectionTitle}>Popular Albums</h2>
                </div>

                {/* TWO COLUMNS */}
                <div className={styles.columnsGrid}>
                    {/* LEFT COLUMN - ALBUMS */}
                    <div className={styles.column}>
                        <div className={styles.albumGrid}>
                            {allAlbums.slice(0, 6).map((album) => (
                                <Link
                                    key={album.id}
                                    to={`/album/${album.id}`}
                                    className={styles.albumCard}
                                >
                                    <div className={styles.albumCoverWrapper}>
                                        {album.coverImage ? (
                                            <img src={album.coverImage} alt={album.name} className={styles.albumCover} />
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
                                    <p className={styles.albumArtist}>{album.artist || "Unknown Artist"}</p>
                                </Link>
                            ))}
                        </div>
                    </div>

                    {/* RIGHT COLUMN - SIDEBAR */}
                    <div className={styles.sidebar}>
                        <div className={styles.sidebarSection}>
                            <h3 className={styles.sidebarTitle}>Trending Now</h3>
                            <div className={styles.trendingList}>
                                {allAlbums.slice(0, 4).map((album, idx) => (
                                    <Link key={album.id} to={`/album/${album.id}`} className={styles.trendingItem}>
                                        <span className={styles.trendingRank}>{idx + 1}</span>
                                        <div className={styles.trendingInfo}>
                                            <div className={styles.trendingName}>{album.name || album.title}</div>
                                            <div className={styles.trendingArtist}>{album.artist || "Unknown"}</div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>

                        <div className={styles.sidebarSection}>
                            <h3 className={styles.sidebarTitle}>Genres</h3>
                            <div className={styles.genreTags}>
                                {["Rock", "Pop", "Hip-Hop", "Electronic", "Jazz", "R&B"].map((genre) => (
                                    <span key={genre} className={styles.genreTag}>
                                        {genre}
                                    </span>
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