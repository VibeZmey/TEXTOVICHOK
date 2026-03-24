import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import SearchBar from "../SearchBar/SearchBar";
import styles from "./Navbar.module.css";

const Navbar = () => {
    const { isAuthenticated, user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = async () => {
        await logout();
        navigate("/home");
    };

    return (
        <nav className={styles.navbar}>
            <div className={styles.navLeft} onClick={() => navigate("/home")}>
                TEXTOVICHEK
            </div>

            <SearchBar
                placeholder="Search lyrics or artists"
                onSearch={(query) => console.log(query)}
            />

            <div className={styles.navRight}>
                {isAuthenticated ? (
                    <>
                        {user?.role !== "user" && user?.role === "Admin" && (
                            <Link
                                to="/admin"
                                className={styles.navLink}
                                style={{ marginRight: 16 }}
                            >
                                Admin
                            </Link>
                        )}



                        <Link to="/profile" className={styles.navLink}>
                            {"Profile"}
                        </Link>

                        <button
                            className={styles.logoutBtn}
                            onClick={handleLogout}
                            style={{ marginLeft: 12 }}
                        >
                            Logout
                        </button>
                    </>
                ) : (
                    <Link
                        to="/login"
                        state={{ from: location.pathname }}
                        className={styles.navLink}
                    >
                        Sign In
                    </Link>
                )}
            </div>
        </nav>
    );
};

export default Navbar;