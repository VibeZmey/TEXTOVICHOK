import { Navigate } from "react-router-dom";
import { useAuth} from "../context/AuthContext.jsx";

const PrivateRoute = ({ children, roles }) => {
    const { isAuthenticated, loading, user } = useAuth();

    if (loading) return null;

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    if (roles?.length) {
        const userRole = user?.role?.name || user?.roleName;
        if (!roles.includes(userRole)) {
            return <Navigate to="/profile" replace />;
        }
    }

    return children;
};

export default PrivateRoute;