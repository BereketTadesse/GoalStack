import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import connectDB from './src/config/db.js';
import userRoutes from './src/routes/user.route.js';
import taskRoutes from './src/routes/task.route.js';
import cookieParser from 'cookie-parser';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, 'uploads');

if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

const app = express();

app.use(express.json());
app.use(cookieParser());
app.use('/uploads', express.static(uploadsDir));

app.get('/health', (req, res) => {
    res.status(200).json({ ok: true, uptime: process.uptime() });
});

app.use('/api/users', userRoutes);
app.use('/api/tasks', taskRoutes);

app.get('/', (req, res) => {
    res.send('GoalStack API is running...');
});

const PORT = process.env.PORT || 5000;

connectDB().catch((error) => {
    console.error('Initial DB connection failed:', error.message);
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});

process.on('unhandledRejection', (reason) => {
    console.error('Unhandled Rejection:', reason);
});

process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
});
