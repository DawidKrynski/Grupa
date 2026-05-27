const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "veloshop-secret";

function authMiddleware(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ message: "Brak tokenu" });
  }

  try {
    req.user = jwt.verify(token, JWT_SECRET);
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

module.exports = { authMiddleware, requireAdmin, JWT_SECRET };
