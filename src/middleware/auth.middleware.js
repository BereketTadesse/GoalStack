import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';

export const protect = async (req, res, next) => {
    let token;

    // 1. Check for token in Cookies
    if (req.cookies && req.cookies.jwt) {
        token = req.cookies.jwt;
    } 
    // 2. Check for token in Authorization Header (Standard for Bearer tokens)
    else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    // If no token is found in either place
    if (!token) {
        return res.status(401).json({ 
            message: "Not authorized, no token found. Please login again." 
        });
    }

    try {
        // Verify the token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Find the user by ID (exclude password for security)
        req.user = await User.findById(decoded.id).select('-password');

        if (!req.user) {
            return res.status(401).json({ message: "Not authorized, user no longer exists" });
        }

        // Proceed to the next middleware or route handler
        next();
    } catch (error) {
        console.error("JWT Verification Error:", error.name, error.message);
        
        // Return 401 so your frontend api.ts can trigger the auto-logout
        res.status(401).json({ 
            message: "Token failed or expired", 
            errorType: error.name,
            errorDetail: error.message 
        });
    }
};