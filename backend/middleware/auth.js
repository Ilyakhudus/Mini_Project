const jwt = require("jsonwebtoken")

const auth = (req, res, next) => {
  try {
    console.log("[AUTH MIDDLEWARE] Request to:", req.method, req.path)

    const authHeader = req.header("Authorization")
    console.log("[AUTH MIDDLEWARE] Authorization header present:", !!authHeader)

    const token = authHeader?.replace("Bearer ", "")
    console.log("[AUTH MIDDLEWARE] Token present:", !!token)

    if (!token) {
      console.log("[AUTH MIDDLEWARE] No token found, rejecting request")
      return res.status(401).json({ error: "No token, authorization denied" })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "your-secret-key")
    console.log("[AUTH MIDDLEWARE] Token verified for user:", decoded.id)
    req.user = decoded
    next()
  } catch (error) {
    console.error("[AUTH MIDDLEWARE] Auth error:", error.message)
    res.status(401).json({ error: "Token is not valid" })
  }
}

const optionalAuth = (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "")

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || "your-secret-key")
      req.user = decoded
    }
    next()
  } catch (error) {
    next()
  }
}

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Not authorized" })
    }
    next()
  }
}

module.exports = { auth, optionalAuth, authorize }
