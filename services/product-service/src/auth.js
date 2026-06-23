const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("./config");

function normalizeTokenPayload(payload) {
    const id = Number(payload.sub || payload.id);

    if (!Number.isInteger(id) || id <= 0 || !["customer", "admin"].includes(payload.role)) {
        throw new Error("Invalid token payload");
    }

    return {
        id,
        role: payload.role
    };
}

function authMiddleware(req, res, next) {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;

    if (!token) {
        return res.status(401).json({ message: "Brak tokenu" });
    }

    try {
        req.authToken = token;
        req.user = normalizeTokenPayload(jwt.verify(token, JWT_SECRET));
        next();
    } catch {
        res.status(401).json({ message: "Nieprawidlowy token" });
    }
}

function requireAdmin(req, res, next) {
    if (req.user?.role !== "admin") {
        return res.status(403).json({ message: "Brak uprawnien" });
    }

    next();
}

module.exports = { authMiddleware, requireAdmin };
