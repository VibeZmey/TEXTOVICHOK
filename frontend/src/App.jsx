import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import HomePage from "./Pages/HomePage";
import AlbumPage from "./Pages/AlbumPage";
import ProfilePage from "./Pages/ProfilePage";
import AdminPage from "./Pages/AdminPage";
import LoginPage from "./Pages/LoginPage";
import LyricsView from "./Pages/LyricsView.jsx";
import "./index.css";
import PrivateRoute from "./Router/PrivateRout";
import Footer from "./Components/Footer/Footer.jsx"; // <- проверь точное имя файла

function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <Routes>
                    <Route path="/" element={<Navigate to="/home" replace/>}/>

                    <Route path="/home" element={<HomePage/>}/>
                    <Route path="/album/:id" element={<AlbumPage/>}/>
                    <Route path="/song/:id" element={<LyricsView/>}/>

                    <Route
                        path="/profile"
                        element={
                            <PrivateRoute roles={["User", "Admin"]}>
                                <ProfilePage/>
                            </PrivateRoute>
                        }
                    />

                    <Route
                        path="/admin"
                        element={
                            <PrivateRoute roles={["Admin"]}>
                                <AdminPage/>
                            </PrivateRoute>
                        }
                    />

                    <Route path="/login" element={<LoginPage/>}/>
                    <Route path="*" element={<Navigate to="/home" replace/>}/>
                </Routes>
                <Footer/>
            </AuthProvider>
        </BrowserRouter>
    );
}

export default App;