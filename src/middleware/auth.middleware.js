import jwt from 'jsonwebtoken'; // <--- This is the missing link!
import User from '../models/user.model.js';

export const protect = async (req, res, next) => {
    // Safely check if req.cookies exists before looking for 'jwt'
    const token = req.cookies ? req.cookies.jwt : null;

    if (!token) {
        return res.status(401).json({ message: "Not authorized, no token" });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = await User.findById(decoded.id).select('-password');
        if (!req.user) {
            return res.status(401).json({ message: "Not authorized, invalid token" });
        }
        next();
    } 
    
    catch (error) {
    console.log("JWT Error Name:", error.name);
    console.log("JWT Error Detail:", error.message);
    
    res.status(401).json({ 
        message: "Token failed", 
        errorType: error.name,
        errorDetail: error.message 
    });
}
};