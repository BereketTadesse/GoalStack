import express from 'express';
import dotenv from 'dotenv';
import connectDB from './src/config/db.js';
import userRoutes from './src/routes/user.route.js';
import taskRoutes from './src/routes/task.route.js';
import cookieParser from 'cookie-parser';
// 1. Load Environment Variables
dotenv.config();

// 2. Connect to Database
connectDB();

const app = express();

// 3. Middlewares

app.use(express.json());
app.use(cookieParser());
app.use('/api/users', userRoutes);
app.use('/api/tasks', taskRoutes);
// 4. Basic Test Route
app.get('/', (req, res) => {
    res.send('GoalStack API is running...');
});

// 5. Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});