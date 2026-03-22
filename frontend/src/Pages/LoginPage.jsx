// src/pages/LoginPage.jsx
import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import styles from "./LoginPage.module.css";

const LoginPage = () => {
    const [login, setLogin] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [isRegister, setIsRegister] = useState(false);

    const { login: authLogin, register: authRegister, loading } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const from = location.state?.from || "/profile";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      if (isRegister) {
        await authRegister(login, password);  // 🔹 напрямую
      } else {
        await authLogin(login, password);
      }
      navigate(from, { replace: true });
    } catch (err) {
      setError(isRegister ? "Registration failed" : "Invalid credentials");
    }
  };

    return (
        <div className={styles.page}>
            <div className={styles.loginCard}>
                <h2>{isRegister ? "Create Account" : "Welcome Back"}</h2>

                {error && <div className={styles.error}>{error}</div>}

                <form onSubmit={handleSubmit} className={styles.form}>
                    <input
                        className={styles.input}
                        placeholder="Username"
                        value={login}
                        onChange={(e) => setLogin(e.target.value)}
                        required
                    />
                    <input
                        className={styles.input}
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />

                    <button
                        type="submit"
                        className={styles.submitBtn}
                        disabled={loading || !login.trim() || !password.trim()}
                    >
                        {loading ? "Loading..." : (isRegister ? "Register" : "Sign In")}
                    </button>
                </form>

                <p className={styles.switch}>
                    {isRegister ? "Already have an account?" : "Don't have an account?"}{" "}
                    <button
                        className={styles.linkBtn}
                        onClick={() => {
                            setIsRegister(!isRegister);
                            setError("");
                        }}
                    >
                        {isRegister ? "Sign In" : "Register"}
                    </button>
                </p>

                <Link to="/home" className={styles.guestLink}>
                    Continue as guest →
                </Link>
            </div>
        </div>
    );
};

export default LoginPage;