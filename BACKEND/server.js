import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

import universalMongoDB from './config/mongoDB.js';
import authRouter from './routes/authroutes/auth.js';


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
    res.status(200).json({ message: 'Server is running' });
});

// routes
// auth routes
app.use('/api/auth', authRouter);

// start server — await DB before listening
async function startServer() {
    await universalMongoDB();
    app.listen(PORT, () => {
        console.log(`-*-*-*-*-*-server is running on http://localhost:${PORT}-*-*-*-*-*-`);
    });
}

startServer();