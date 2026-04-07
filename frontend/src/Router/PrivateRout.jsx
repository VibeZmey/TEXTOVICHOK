import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const PrivateRoute = ({ children, roles }) => {
    const { isAuthenticated, loading, user } = useAuth();

    if (loading) return null;
    if (!isAuthenticated) return <Navigate to="/login" replace />;

    if (roles?.length && user?.role) {
        const allowed = roles.map(r => r.toLowerCase());
        if (!allowed.includes(user.role.toLowerCase())) {
            return <Navigate to="/profile" replace />;
        }
    }

    return children;
};

export default PrivateRoute;