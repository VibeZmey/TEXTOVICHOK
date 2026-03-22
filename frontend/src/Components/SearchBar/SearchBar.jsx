import { useState } from "react";
import styles from "./SearchBar.module.css";

const SearchBar = ({
                       placeholder = "Search lyrics or artists",
                       value = "",
                       onChange,
                       onSearch,
                       className = "",
                       autoFocus = false,
                       disabled = false,
                       showIcon = true,
                       showClear = true,
                   }) => {
    const [isFocused, setIsFocused] = useState(false);

    const handleChange = (e) => {
        onChange?.(e.target.value);
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter") {
            onSearch?.(value);
        }
    };

    const handleClear = () => {
        onChange?.("");
    };

    return (
        <div className={`${styles.searchContainer} ${className} ${isFocused ? styles.focused : ""}`}>
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
                placeholder={placeholder}
                value={value}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                autoFocus={autoFocus}
                disabled={disabled}
            />
            {showClear && value && (
                <button className={styles.clearButton} onClick={handleClear} type="button">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                </button>
            )}
        </div>
    );
};

export default SearchBar;