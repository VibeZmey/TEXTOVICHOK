import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import HomePage from "./pages/HomePage";
import AlbumPage from "./pages/AlbumPage";
import ProfilePage from "./pages/ProfilePage";
import AdminPage from "./pages/AdminPage";
import LoginPage from "./pages/LoginPage";
import LyricsView from "./components/Lyrics/LyricsView";
import "./index.css";
import { mockUsers } from "./data/mockData";
import PrivateRoute from "./Router/PrivateRout";

const initAnnotationsStorage = () => {
    mockUsers.forEach(user => {
        user.annotations?.forEach(ann => {
            const key = `mock_annotations_${ann.lyricsId || ann.albumId}`;
            const existing = JSON.parse(localStorage.getItem(key) || "[]");

            // Добавляем аннотацию, если её ещё нет
            if (!existing.find(a => a.id === ann.id)) {
                localStorage.setItem(key, JSON.stringify([...existing, {
                    ...ann,
                    userId: user.id // ← Обязательно!
                }]));
            }
        });
    });
};

initAnnotationsStorage();

function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <Routes>
                    <Route path="/" element={<Navigate to="/home" replace />} />

                    <Route path="/home" element={<HomePage />} />
                    <Route path="/album/:id" element={<AlbumPage />} />
                    <Route path="/song/:id" element={<LyricsView />} />

                    {/* ← ← ← ЗАЩИЩЁННЫЕ РОУТЫ */}
                    <Route path="/profile" element={
                        <PrivateRoute>
                            <ProfilePage />
                        </PrivateRoute>
                    } />

                    <Route path="/admin" element={
                        <PrivateRoute roles={["Admin"]}> {/* ← Только админы */}
                            <AdminPage />
                        </PrivateRoute>
                    } />

                    <Route path="/login" element={<LoginPage />} />
                    <Route path="*" element={<Navigate to="/home" replace />} />
                </Routes>
            </AuthProvider>
        </BrowserRouter>
    );
}

export default App;