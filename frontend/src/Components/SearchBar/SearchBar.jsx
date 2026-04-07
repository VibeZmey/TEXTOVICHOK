// src/components/SearchBar/SearchBar.jsx
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSearchAlbums } from '../../hooks';
import styles from './SearchBar.module.css';

const CDN_BASE = 'http://localhost:9000';

const SearchBar = ({ showIcon = true }) => { // 👈 Добавили пропс showIcon
    const [query, setQuery] = useState('');
    const [debouncedQuery, setDebouncedQuery] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const navigate = useNavigate();
    const wrapperRef = useRef(null);

    // 🔥 Debounce: задержка 300мс перед передачей запроса в хук
    useEffect(() => {
        if (!query || query.trim().length < 1) {
            setDebouncedQuery('');
            return;
        }

        const timer = setTimeout(() => {
            setDebouncedQuery(query);
        }, 300);

        return () => clearTimeout(timer);
    }, [query]);

    // Используем хук с дебунсед-запросом
    const { albums, isLoading, isError } = useSearchAlbums(debouncedQuery, {
        limit: 10,
        enabled: true,
    });

    // Закрытие при клике вне
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Закрытие при навигации
    useEffect(() => {
        setIsOpen(false);
        setQuery('');
    }, [navigate]);

    const handleSelectAlbum = (album) => {
        navigate(`/album/${album.id}`);
        setIsOpen(false);
        setQuery('');
    };

    // Показываем результаты только если есть запрос И не загружается
    const showResults = isOpen && debouncedQuery.trim().length >= 1 && !isLoading;

    return (
        <div className={styles.searchWrapper} ref={wrapperRef}>
            <div className={styles.searchContainer}>
                {/* 🔍 Условное отображение иконки */}
                {showIcon && (
                    <span className={styles.searchIcon}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
          </span>
                )}

                <input
                    type="text"
                    className={styles.searchInput}
                    placeholder="Search albums..."
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        setIsOpen(true);
                    }}
                    onFocus={() => debouncedQuery.trim().length >= 1 && setIsOpen(true)}
                    onKeyDown={(e) => {
                        if (e.key === 'Escape') {
                            setIsOpen(false);
                            setQuery('');
                        }
                    }}
                />

                {query && (
                    <button
                        className={styles.searchClear}
                        onClick={() => {
                            setQuery('');
                            setDebouncedQuery('');
                            setIsOpen(false);
                        }}
                        type="button"
                    >
                        ✕
                    </button>
                )}
            </div>

            {/* Выпадающие результаты */}
            {showResults && (
                <div className={styles.searchResults}>
                    {isError ? (
                        <div className={styles.searchError}>
                            <span>Search failed</span>
                        </div>
                    ) : albums?.length > 0 ? (
                        <ul className={styles.resultsList}>
                            {albums.map((album) => (
                                <li
                                    key={album.id}
                                    className={styles.resultItem}
                                    onClick={() => handleSelectAlbum(album)}
                                >
                                    <div className={styles.resultCover}>
                                        {album.imageUrl ? (
                                            <img
                                                src={`${CDN_BASE}/${album.imageUrl}`}
                                                alt={album.name}
                                            />
                                        ) : (
                                            <span className={styles.coverPlaceholder}>🎵</span>
                                        )}
                                    </div>
                                    <div className={styles.resultInfo}>
                                        <span className={styles.resultName}>{album.name}</span>
                                        <span className={styles.resultYear}>{album.year || 'N/A'}</span>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    ) : debouncedQuery ? (
                        <div className={styles.searchEmpty}>
                            <span>No albums found for "{debouncedQuery}"</span>
                        </div>
                    ) : null}
                </div>
            )}
        </div>
    );
};

export default SearchBar;