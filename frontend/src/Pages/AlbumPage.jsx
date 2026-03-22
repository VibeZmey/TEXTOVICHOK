import { Link, useParams, useNavigate } from "react-router-dom";
import SearchBar from "../Components/SearchBar/SearchBar.jsx";
import styles from "./AlbumPage.module.css";

const STORAGE_KEY = "mock_user_albums";
const albumsMap = {
    "1": {
        id: "1",
        name: "After Hours",
        artist: "The Weeknd",
        year: 2020,
        description: "Best-selling album",
        coverUrl: "",
        songs: [
            { id: "1", name: "Alone Again" },
            { id: "2", name: "Blinding Lights" },
            { id: "3", name: "Save Your Tears" },
            { id: "4", name: "In Your Eyes" },
        ],
    },
    "2": {
        id: "2",
        name: "DAMN.",
        artist: "Kendrick Lamar",
        year: 2017,
        description: "Pulitzer Prize winner",
        coverUrl: "",
        songs: [
            { id: "5", name: "DNA." },
            { id: "6", name: "HUMBLE." },
            { id: "7", name: "LOVE." },
        ],
    },
};

const AlbumPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    let album = null;
    try {
        const userAlbums = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
        album = userAlbums.find((a) => a.id === id);
    } catch {}

    if (!album && albumsMap[id]) album = albumsMap[id];
    if (!album) album = { id, name: "Unknown Album", description: "", coverImage: "", songs: [] };

    return (
        <div className={styles.page}>
            {/* NAVBAR */}
            <div className={styles.navbar}>
                <Link to="/home" className={styles.navLeft}>Home</Link>
                <SearchBar
                    placeholder="Search lyrics or artists"
                    onSearch={(query) => console.log(query)}
                />
                <Link className={styles.navRight} to="/profile">Profile</Link>
            </div>

            {/* HERO SECTION WITH ALBUM INFO */}
            <div className={styles.albumHero}>
                <div className={styles.heroContent}>
                    <div className={styles.heroAccent} />
                    <div className={styles.albumCoverLarge}>
                        {album.coverImage ? (
                            <img src={album.coverImage} alt={album.name} className={styles.coverImage} />
                        ) : (
                            <div className={styles.coverPlaceholder}>
                                <span className={styles.coverIcon}>🎵</span>
                            </div>
                        )}
                        <div className={styles.coverGlow} />
                    </div>
                </div>
                <div className={styles.albumHeroInfo}>
                    <h1 className={styles.albumTitle}>{album.name || album.title}</h1>
                    <div className={styles.albumMeta}>
                        <span className={styles.artistName}>{album.artist || "Unknown Artist"}</span>
                    </div>
                </div>
            </div>

            {/* MAIN CONTENT */}
            <div className={styles.contentWrapper}>
                {/* SECTION TITLE */}
                <div className={styles.sectionHeader}>
                    <h2 className={styles.sectionTitle}>Tracklist</h2>
                </div>

                {/* TWO COLUMNS */}
                <div className={styles.columnsGrid}>
                    {/* LEFT COLUMN - TRACKS */}
                    <div className={styles.column}>
                        <div className={styles.trackList}>
                            {album.songs && album.songs.length ? (
                                album.songs.map((track, index) => (
                                    <button
                                        key={track.id}
                                        className={styles.trackItem}
                                        onClick={() => navigate(`/song/${track.id}`)}
                                    >
                                        <span className={styles.trackIndex}>{index + 1}</span>
                                        <div className={styles.trackInfo}>
                                            <span className={styles.trackName}>{track.name || track.title}</span>
                                            <span className={styles.trackArtist}>{album.artist || "Unknown"}</span>
                                        </div>
                                        <span className={styles.trackDuration}>--:--</span>
                                    </button>
                                ))
                            ) : (
                                <div className={styles.emptyState}>
                                    <span className={styles.emptyIcon}>🎵</span>
                                    <p>No tracks in this album yet</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* RIGHT COLUMN - SIDEBAR */}
                    <div className={styles.sidebar}>
                        {/* ALBUM INFO CARD */}
                        <div className={styles.sidebarCard}>
                            <h3 className={styles.sidebarTitle}>About Album</h3>

                            {album.description && (
                                <div className={styles.infoBlock}>
                                    <span className={styles.infoLabel}>Description</span>
                                    <p className={styles.infoText}>{album.description}</p>
                                </div>
                            )}

                            <div className={styles.infoBlock}>
                                <span className={styles.infoLabel}>Release Info</span>
                                <div className={styles.infoRow}>
                                    <span className={styles.infoLabelSmall}>Year</span>
                                    <span className={styles.infoValue}>{album.year || "N/A"}</span>
                                </div>
                                {album.artist && (
                                    <div className={styles.infoRow}>
                                        <span className={styles.infoLabelSmall}>Artist</span>
                                        <span className={styles.infoValue}>{album.artist}</span>
                                    </div>
                                )}
                                <div className={styles.infoRow}>
                                    <span className={styles.infoLabelSmall}>Tracks</span>
                                    <span className={styles.infoValue}>{album.songs?.length || 0}</span>
                                </div>
                            </div>

                            {album.genres && album.genres.length > 0 && (
                                <div className={styles.infoBlock}>
                                    <span className={styles.infoLabel}>Genres</span>
                                    <div className={styles.genreTags}>
                                        {album.genres.map((genre, idx) => (
                                            <span key={idx} className={styles.genreTag}>{genre}</span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AlbumPage;