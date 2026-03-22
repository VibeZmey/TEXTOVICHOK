import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import HomePage from "./Pages/HomePage";
import AlbumPage from "./Pages/AlbumPage";
import ProfilePage from "./Pages/ProfilePage";
import AdminPage from "./Pages/AdminPage";
import LoginPage from "./Pages/LoginPage";
import LyricsView from "./Components/Lyrics/LyricsView";
import "./index.css";
import { mockUsers } from "./data/mockData";
import PrivateRoute from "./Router/PrivateRout";

const initAnnotationsStorage = () => {
    mockUsers.forEach(user => {
        user.annotations?.forEach(ann => {
            const key = `mock_annotations_${ann.lyricsId || ann.albumId}`;
            const existing = JSON.parse(localStorage.getItem(key) || "[]");

            if (!existing.find(a => a.id === ann.id)) {
                localStorage.setItem(key, JSON.stringify([...existing, {
                    ...ann,
                    userId: user.id
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

                    <Route path="/profile" element={
                        <PrivateRoute>
                            <ProfilePage />
                        </PrivateRoute>
                    } />

                    <Route path="/admin" element={
                        <PrivateRoute roles={["Admin"]}>
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