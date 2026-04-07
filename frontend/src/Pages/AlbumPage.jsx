// src/pages/AlbumPage/AlbumPage.jsx
import { useParams, useNavigate } from "react-router-dom";
import {useEffect, useMemo, useState} from "react";
import styles from "./AlbumPage.module.css";

// Компоненты
import Navbar from "../Components/NavBar/NavBar.jsx";
// Хуки
import { useAlbum, useAlbumLyrics, useUser } from "../hooks";

const CDN_BASE = "http://localhost:9000";

const AlbumPage = () => {
    const { id: albumId } = useParams();
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState("");

    // 🔥 React Query: загрузка данных (параллельно, с кэшированием)
    const {
        album,
        isLoading: albumLoading,
        isError: albumError,
        error: albumFetchError
    } = useAlbum(albumId);

    const {
        lyrics: tracks,
        isLoading: tracksLoading,
        isError: tracksError,
        invalidate: invalidateTracks
    } = useAlbumLyrics(albumId);

    // 🔥 Загружаем артиста только когда известен userId из альбома
    const {
        user: artist,
        isLoading: artistLoading
    } = useUser(album?.userId);

    // 🔥 Сводные состояния
    const isLoading = albumLoading || tracksLoading;
    const isError = albumError || tracksError;
    const error = albumFetchError || tracksError;

    // 🔥 Нормализация данных альбома (с подстановкой имени артиста)
    const normalizedAlbum = useMemo(() => {
        if (!album) {
            return {
                id: albumId,
                name: "Unknown Album",
                artistName: "Unknown Artist",
                year: "N/A",
                description: "",
                coverImage: "",
                genres: [],
            };
        }

        return {
            ...album,
            name: album.name || album.title || "Unknown Album",
            // ✅ Используем реальное имя артиста из кэша
            artistName: artist?.login || (artistLoading ? "Loading..." : "Unknown Artist"),
            year: album.year || "N/A",
            description: album.description || "",
            coverImage: album.imageUrl || "",
            genres: Array.isArray(album.genres) ? album.genres : [],
        };
    }, [album, artist, artistLoading, albumId]);

    // ===== ФИЛЬТРАЦИЯ ТРЕКОВ ПО ПОИСКУ =====
    const filteredTracks = useMemo(() => {
        if (!tracks || !searchQuery.trim()) return tracks;

        const query = searchQuery.toLowerCase().trim();
        return tracks.filter((track) => {
            const trackName = (track.name || track.title || "").toLowerCase();
            return trackName.includes(query);
        });
    }, [tracks, searchQuery]);

    // Обработка ошибки загрузки
    if (isError) {
        return (
            <div className={styles.errorPage}>
                <Navbar />
                <div className={styles.errorContent}>
                    <h2>Failed to load album</h2>
                    <p>{error?.message || "Please try again later"}</p>
                    <button onClick={() => navigate(-1)} className={styles.retryButton}>
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    // ===== DIAGNOSTIC LOGS =====
    useEffect(() => {
        console.group('🔍 AlbumPage Debug');
        console.log('📦 album:', album);
        console.log('👤 album.userId:', album?.userId);
        console.log('🎨 artist:', artist);
        console.log('🎵 tracks:', tracks?.[0]);
        console.log('⚙️ States:', { albumLoading, artistLoading, tracksLoading });
        console.groupEnd();
    }, [album, artist, tracks, albumLoading, artistLoading, tracksLoading]);


    return (
        <div className={styles.page}>
            <Navbar />

            {/* ALBUM HERO */}
            <div className={styles.albumHero}>
                <div className={styles.heroContent}>
                    <div className={styles.heroAccent} />
                    <div className={styles.albumCoverLarge}>
                        {normalizedAlbum.coverImage ? (
                            <img
                                src={`${CDN_BASE}/${normalizedAlbum.coverImage}`}
                                alt={normalizedAlbum.name}
                                className={styles.albumCover}
                                loading="lazy"
                            />
                        ) : (
                            <div className={styles.albumCoverPlaceholder}>
                                <span className={styles.coverIcon}>🎵</span>
                            </div>
                        )}
                        <div className={styles.coverGlow} />
                    </div>
                </div>
                <div className={styles.albumHeroInfo}>
                    <h1 className={styles.albumTitle}>{normalizedAlbum.name}</h1>
                    <div className={styles.albumMeta}>
                        {/* ✅ Показываем имя артиста с состоянием загрузки */}
                        <span className={styles.artistName}>
              {artistLoading ? "Loading artist..." : normalizedAlbum.artistName}
            </span>
                    </div>
                </div>
            </div>

            <div className={styles.contentWrapper}>
                <div className={styles.sectionHeader}>
                    <h2 className={styles.sectionTitle}>Tracklist</h2>
                </div>

                <div className={styles.columnsGrid}>
                    {/* TRACKLIST */}
                    <div className={styles.column}>
                        <div className={styles.trackList}>
                            {isLoading ? (
                                <div className={styles.emptyState}>Loading tracks...</div>
                            ) : tracks?.length > 0 ? (
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
                      <span className={styles.trackName}>
                        {track.name || track.title || "Untitled"}
                      </span>
                                            {/* ✅ Показываем имя артиста для каждой песни */}
                                            <span className={styles.trackArtist}>
                        {normalizedAlbum.artistName}
                      </span>
                                        </div>
                                        <span className={styles.trackDuration}>
                      {formatDuration(track.duration)}
                    </span>
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

                    {/* SIDEBAR */}
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
                                    <span className={styles.infoValue}>
                    {normalizedAlbum.artistName}
                  </span>
                                </div>
                                <div className={styles.infoRow}>
                                    <span className={styles.infoLabelSmall}>Tracks</span>
                                    <span className={styles.infoValue}>{tracks?.length || 0}</span>
                                </div>
                            </div>

                            {normalizedAlbum.genres?.length > 0 && (
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

// ===== Утилиты =====

/**
 * Форматирует длительность в секундах в мм:сс
 * @param {number | null | undefined} seconds
 * @returns {string}
 */
const formatDuration = (seconds) => {
    if (seconds === null || seconds === undefined) return "--:--";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export default AlbumPage;