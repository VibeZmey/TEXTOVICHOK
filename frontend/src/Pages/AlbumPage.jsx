import { Link, useParams, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import SearchBar from "../Components/SearchBar/SearchBar.jsx";
import styles from "./AlbumPage.module.css";
import { albumService, userService } from "../api/apiService";
import Navbar from "../Components/NavBar/NavBar.jsx";

const CDN_BASE = "http://localhost:9000";

const AlbumPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [album, setAlbum] = useState(null);
    const [tracks, setTracks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [artist, setArtist] = useState(null);

    useEffect(() => {
        if (!id) return;

        const loadAlbumPage = async () => {
            setLoading(true);
            setError("");

            try {
                // 1) Берем альбом из общего списка (без GET /albums/:id)
                const albumsRes = await albumService.getAll();
                const allAlbums = Array.isArray(albumsRes?.data) ? albumsRes.data : [];
                const currentAlbum = allAlbums.find((a) => String(a.id) === String(id)) || null;
                setAlbum(currentAlbum);
                const a = await userService.getUserById(currentAlbum.userId);
                setArtist(a.data);

                // 2) Треки альбома отдельным эндпоинтом
                const lyricsRes = await albumService.getLyrics(id);
                setTracks(Array.isArray(lyricsRes?.data) ? lyricsRes.data : []);
            } catch (err) {
                console.error("Failed to load album page:", err?.response?.data || err);
                setError("Failed to load album");
                setAlbum(null);
                setTracks([]);
            } finally {
                setLoading(false);
            }
        };

        loadAlbumPage();

    }, []);

    const load = async () => {
        const res = await albumService.getLyrics(albumId);
        console.log("getLyrics response:", res);
        console.log("getLyrics data:", res.data);
    };

    load();

    const normalizedAlbum = useMemo(() => {
        if (!album) {
            return {
                id,
                name: "Unknown Album",
                artist: "Unknown Artist",
                year: "N/A",
                description: "",
                coverImage: "",
                genres: [],
            };
        }
        
        return {
            ...album,
            name: album.name || album.title || "Unknown Album",
            artist: "Unknown Artist",
            year: album.year || "N/A",
            description: album.description || "",
            coverImage: album.imageUrl || "",
            genres: Array.isArray(album.genres) ? album.genres : [],
        };
    }, [album, id]);



    return (
        <div className={styles.page}>
            <Navbar/>

            <div className={styles.albumHero}>
                <div className={styles.heroContent}>
                    <div className={styles.heroAccent} />
                    <div className={styles.albumCoverLarge}>
                        {normalizedAlbum.coverImage ? (
                                        <img
                                            src={`${CDN_BASE}/${normalizedAlbum.coverImage}`}
                                            alt={album.name}
                                            className={styles.albumCover}
                                        />
                                    ) : (
                                        <div className={styles.albumCoverPlaceholder} />
                                    )}
                        <div className={styles.coverGlow} />
                    </div>
                </div>
                <div className={styles.albumHeroInfo}>
                    <h1 className={styles.albumTitle}>{normalizedAlbum.name}</h1>
                    <div className={styles.albumMeta}>
                        <span className={styles.artistName}>{artist != null ? artist.login : "Unknown Artist"}</span>
                    </div>
                </div>
            </div>

            <div className={styles.contentWrapper}>
                <div className={styles.sectionHeader}>
                    <h2 className={styles.sectionTitle}>Tracklist</h2>
                </div>

                <div className={styles.columnsGrid}>
                    <div className={styles.column}>
                        <div className={styles.trackList}>
                            {loading ? (
                                <div className={styles.emptyState}>Loading tracks...</div>
                            ) : error ? (
                                <div className={styles.emptyState}>{error}</div>
                            ) : tracks.length > 0 ? (
                                tracks.map((track, index) => (
                                    <button
                                        key={track.id}
                                        className={styles.trackItem}
                                        onClick={() =>
                                            navigate(`/song/${track.id}`, {
                                                state: { track, album: normalizedAlbum }
                                            })
                                        }
                                    >
                                        <span className={styles.trackIndex}>{index + 1}</span>
                                        <div className={styles.trackInfo}>
                                            <span className={styles.trackName}>{track.name || track.title || "Untitled"}</span>
                                            <span className={styles.trackArtist}>{artist != null ? artist.login : "Unknown Artist"}</span>
                                        </div>
                                        <span className={styles.trackDuration}>{track.duration || "--:--"}</span>
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

                    <div className={styles.sidebar}>
                        <div className={styles.sidebarCard}>
                            <h3 className={styles.sidebarTitle}>About Album</h3>

                            {normalizedAlbum.description && (
                                <div className={styles.infoBlock}>
                                    <span className={styles.infoLabel}>Description</span>
                                    <p className={styles.infoText}>{normalizedAlbum.description}</p>
                                </div>
                            )}

                            <div className={styles.infoBlock}>
                                <span className={styles.infoLabel}>Release Info</span>
                                <div className={styles.infoRow}>
                                    <span className={styles.infoLabelSmall}>Year</span>
                                    <span className={styles.infoValue}>{normalizedAlbum.year}</span>
                                </div>
                                <div className={styles.infoRow}>
                                    <span className={styles.infoLabelSmall}>Artist</span>
                                    <span className={styles.infoValue}>{normalizedAlbum.artist}</span>
                                </div>
                                <div className={styles.infoRow}>
                                    <span className={styles.infoLabelSmall}>Tracks</span>
                                    <span className={styles.infoValue}>{tracks.length}</span>
                                </div>
                            </div>

                            {normalizedAlbum.genres.length > 0 && (
                                <div className={styles.infoBlock}>
                                    <span className={styles.infoLabel}>Genres</span>
                                    <div className={styles.genreTags}>
                                        {normalizedAlbum.genres.map((genre, idx) => (
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