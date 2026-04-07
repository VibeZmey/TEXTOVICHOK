export function decodeJwt(token) {
    if (!token) return null;
    try {
        const payload = token.split(".")[1];
        const b = payload.replace(/-/g, "+").replace(/_/g, "/");
        const jsonStr = decodeURIComponent(
            atob(b)
                .split("")
                .map(c => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
                .join("")
        );
        return JSON.parse(jsonStr);
    } catch {
        return null;
    }
}

export function mapUserFromToken(payload) {
    if (!payload) return null;
    return {
        id: payload.userId,
        role: payload.role,
    };
}