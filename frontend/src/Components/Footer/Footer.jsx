// src/components/Footer/Footer.jsx
import { Link } from "react-router-dom";
import styles from "./Footer.module.css";

const Footer = () => {
    const currentYear = new Date().getFullYear();

    return (
        <footer className={styles.footer}>
            <div className={styles.footerContent}>

                {/* ===== BRAND & DESCRIPTION ===== */}
                <div className={styles.footerBrand}>
                    <Link to="/" className={styles.footerLogo}>
                        <span className={styles.logoText}>TEXTOVICHEK</span>
                    </Link>
                    <p className={styles.footerDescription}>
                        Discover music, read lyrics, and share your thoughts with the community.
                    </p>

                    {/* Social Links */}
                    <div className={styles.socialLinks}>
                        <a href="#" className={styles.socialLink} aria-label="Twitter">
                            <span className={styles.socialIcon}>🐦</span>
                        </a>
                        <a href="#" className={styles.socialLink} aria-label="GitHub">
                            <span className={styles.socialIcon}>💻</span>
                        </a>
                        <a href="#" className={styles.socialLink} aria-label="Discord">
                            <span className={styles.socialIcon}>💬</span>
                        </a>
                        <a href="#" className={styles.socialLink} aria-label="Telegram">
                            <span className={styles.socialIcon}>✈️</span>
                        </a>
                    </div>
                </div>

                {/* ===== NAVIGATION LINKS ===== */}
                <div className={styles.footerNav}>
                    <h4 className={styles.navTitle}>Explore</h4>
                    <ul className={styles.navList}>
                        <li><Link to="/" className={styles.navLink}>Home</Link></li>
                        <li><Link to="/albums" className={styles.navLink}>Albums</Link></li>
                        <li><Link to="/artists" className={styles.navLink}>Artists</Link></li>
                        <li><Link to="/genres" className={styles.navLink}>Genres</Link></li>
                    </ul>
                </div>

                <div className={styles.footerNav}>
                    <h4 className={styles.navTitle}>Community</h4>
                    <ul className={styles.navList}>
                        <li><Link to="/annotations" className={styles.navLink}>Annotations</Link></li>
                        <li><Link to="/leaderboard" className={styles.navLink}>Leaderboard</Link></li>
                        <li><Link to="/guidelines" className={styles.navLink}>Guidelines</Link></li>
                        <li><Link to="/support" className={styles.navLink}>Support</Link></li>
                    </ul>
                </div>

                <div className={styles.footerNav}>
                    <h4 className={styles.navTitle}>Legal</h4>
                    <ul className={styles.navList}>
                        <li><Link to="/privacy" className={styles.navLink}>Privacy Policy</Link></li>
                        <li><Link to="/terms" className={styles.navLink}>Terms of Service</Link></li>
                        <li><Link to="/cookies" className={styles.navLink}>Cookie Policy</Link></li>
                        <li><Link to="/contact" className={styles.navLink}>Contact Us</Link></li>
                    </ul>
                </div>
            </div>

            {/* ===== BOTTOM BAR ===== */}
            <div className={styles.footerBottom}>
                <div className={styles.copyright}>
                    © {currentYear} LyricNotes. All rights reserved.
                </div>
            </div>
        </footer>
    );
};

export default Footer;