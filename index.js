import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import cors from 'cors';
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

// ✅ Normalize helper (prevents trailing-slash mismatches)
const normalizeOrigin = (o) => (o ? o.trim().replace(/\/$/, '') : o);

// ✅ Default origins (dev + your Render frontend if you have one)
const defaultOrigins = [
  'http://localhost:8080',
  'https://goalstack-fl7j.onrender.com',
  'https://welcome-hub-five.vercel.app'
];

// ✅ Allowed origins from env or defaults
const allowedOrigins = (process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',')
  : defaultOrigins
).map(normalizeOrigin);

// ✅ Core middleware
app.use(express.json());
app.use(cookieParser());

// ✅ CORS config (important for cookies)
const corsOptions = {
  origin: function (origin, callback) {
    // Requests like curl/postman may have no origin
    if (!origin) return callback(null, true);

    const normalized = normalizeOrigin(origin);

    // Allow exact matches + any localhost (different ports)
    const isAllowed =
      allowedOrigins.includes(normalized) ||
      normalized.startsWith('http://localhost') ||
      normalized.startsWith('https://localhost');

    if (isAllowed) {
      callback(null, true);
    } else {
      console.log('Blocked by CORS. Origin was:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

// ✅ Apply CORS + handle preflight
app.use(cors(corsOptions));
app.options('/*path', cors(corsOptions));

// ✅ Static uploads
app.use('/uploads', express.static(uploadsDir));

// ✅ Health check
app.get('/health', (req, res) => {
  res.status(200).json({ ok: true, uptime: process.uptime() });
});

// ✅ Routes
app.use('/api/users', userRoutes);
app.use('/api/tasks', taskRoutes);

app.get('/', (req, res) => {
  res.send('GoalStack API is running...');
});

const PORT = process.env.PORT || 5000;

// ✅ Connect DB (log if fails)
connectDB().catch((error) => {
  console.error('Initial DB connection failed:', error.message);
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});