// src/pages/AdminPage/AdminAlbumCard.jsx
import { useMemo } from "react";
import styles from "./AdminPage.module.css";
import { useAlbumLyrics } from "../hooks/index.js";

const CDN_BASE = "http://localhost:9000";

const AdminAlbumCard = ({ album, formatDuration, truncateText }) => {
    const {
        lyrics: albumTracks,
        isLoading: tracksLoading,
        isError: tracksError
    } = useAlbumLyrics(album.id);

    const albumName = album.name || "Unknown Album";
    const albumYear = album.year || "N/A";

    // Приоритет: данные из хука > локальные данные альбома
    const songs = useMemo(() => {
        if (albumTracks) return albumTracks;
        if (album.songs) return album.songs;
        if (album.lyrics) return album.lyrics;
        if (album.tracks) return album.tracks;
        return [];
    }, [albumTracks, album]);

    const trackCount = songs.length;

    return (
        <div className={styles.albumCard}>
            {/* Cover + Header */}
            <div className={styles.albumHeader}>
                <div className={styles.albumCoverWrapper}>
                    {album.imageUrl ? (
                        <img
                            src={`${CDN_BASE}/${album.imageUrl}`}
                            alt={albumName}
                            className={styles.albumCover}
                            loading="lazy"
                        />
                    ) : (
                        <div className={styles.albumCoverPlaceholder}>
                            <span className={styles.coverIcon}>🎵</span>
                        </div>
                    )}
                </div>

                <div className={styles.albumInfo}>
                    <h3 className={styles.albumName}>{albumName}</h3>
                    <div className={styles.albumMeta}>
                        <span className={styles.metaItem}>
                            {tracksLoading
                                ? "…"
                                : tracksError
                                    ? "⚠️"
                                    : trackCount} track{trackCount !== 1 ? "s" : ""}
                        </span>
                        <span className={styles.metaDivider}>•</span>
                        <span className={styles.metaItem}>{albumYear}</span>
                    </div>
                    {album.description && (
                        <p className={styles.albumDescription}>
                            {truncateText(album.description, 120)}
                        </p>
                    )}
                </div>
            </div>

            {/* Tracklist */}
            {trackCount > 0 ? (
                <div className={styles.tracklistContainer}>
                    <div className={styles.tracklistHeader}>
                        <span className={styles.tracklistTitle}>Tracklist</span>
                        <span className={styles.tracklistCount}>{trackCount}</span>
                    </div>

                    <ul className={styles.tracklist}>
                        {songs.map((song, index) => {
                            const trackName = song.name || song.title || "Untitled";
                            const duration = formatDuration(song.duration);

                            return (
                                <li
                                    key={song.id || index}
                                    className={styles.trackItem}
                                    title={trackName}
                                >
                                    <span className={styles.trackNumber}>
                                        {String(index + 1).padStart(2, '0')}
                                    </span>
                                    <div className={styles.trackDetails}>
                                        <span className={styles.trackName}>{trackName}</span>
                                        {song.description && (
                                            <span className={styles.trackDescription}>
                                                {truncateText(song.description, 40)}
                                            </span>
                                        )}
                                    </div>
                                    {duration !== "--:--" && (
                                        <span className={styles.trackDuration}>{duration}</span>
                                    )}
                                </li>
                            );
                        })}
                    </ul>
                </div>
            ) : (
                <div className={styles.tracklistPlaceholder}>
                    {tracksLoading ? "Loading tracks…" : "No tracks available"}
                </div>
            )}
        </div>
    );
};

export default AdminAlbumCard;