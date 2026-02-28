import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

import universalMongoDB from './config/mongoDB.js';
import authRouter from './routes/authroutes/auth.js';
import newBuildIntakeRouter from './routes/buildroutes/newBuildIntake.js';
import costRouter from './routes/buildroutes/costRoutes.js';

//image setup
import imageKitRouter from "./routes/imageKitRoutes.js";

const app = express();
const PORT = process.env.PORT || 4022;

// CORS configuration to allow requests from the frontend
app.use(
    cors({
        origin: (origin, callback) => {
            const allowedOrigins = [
                // ---dev---
                'http://localhost:8081',
                'http://localhost:3000',
                'http://192.168.0.108:3000',
                'http://192.168.0.108:19006',
                'http://192.168.0.108:19007',
                'http://127.0.0.1:3000',
                'http://192.168.0.108:8081',
                // ---prod---
                'https://city-builder-frontend.onrender.com',
            ];
            if (!origin) {
                return callback(null, true);
            }
            if (allowedOrigins.includes(origin)) {
                return callback(null, true);
            }
            return callback(new Error('Not allowed by CORS'));
        },
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
        credentials: true,
    })
);

// middleware to parse JSON and URL encoded data
app.use(express.json({ limit: '10mb' }));
//app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// middleware to parse cookies
app.use(cookieParser());

//health check
app.get('/health', (req, res) => {
    console.log('[server.js] ✅ /health hit');
    res.status(200).json({ message: 'Server is running' });
});

// ── Global request logger — logs EVERY incoming request ──
app.use((req, res, next) => {
    console.log(`[server.js] ➡️  ${req.method} ${req.originalUrl}`);
    next();
});

// routes
//imageKit routes
console.log('[server.js] 🔌 Mounting imageKitRouter at /api/imagekit');
app.use("/api/imagekit", imageKitRouter);
// auth routes
console.log('[server.js] 🔌 Mounting authRouter at /api/auth');
app.use('/api/auth', authRouter);
// new build intake route
console.log('[server.js] 🔌 Mounting newBuildIntakeRouter at /api/builds');
app.use('/api/builds', newBuildIntakeRouter);
// cost overview routes
console.log('[server.js] 🔌 Mounting costRouter at /api/costs');
app.use('/api/costs', costRouter);

// ── Catch-all: logs any request that didn't match a route ──
app.use((req, res) => {
    console.log(`[server.js] ❌ No route matched: ${req.method} ${req.originalUrl}`);
    res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.originalUrl}` });
});

// start server — await DB before listening
async function startServer() {
    await universalMongoDB();
    app.listen(PORT, () => {
        console.log(`-*-*-*-*-*-server is running on http://localhost:${PORT}-*-*-*-*-*-`);
    });
}

startServer();