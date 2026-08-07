import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config } from './config/index.js';
import { connectDB } from './config/db.js';
import { setIO } from './services/socket.js';
import { runSeed } from './services/seedService.js';
import authRoutes from './routes/auth.js';
import restaurantRoutes from './routes/restaurants.js';
import queueRoutes from './routes/queue.js';
import tableRoutes from './routes/tables.js';
import orderRoutes from './routes/orders.js';
import analyticsRoutes from './routes/analytics.js';
import whatsappRoutes from './routes/whatsapp.js';
import superadminRoutes from './routes/superadmin.js';
import paymentRoutes from './routes/payments.js';
const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: { origin: config.frontendUrl, methods: ['GET', 'POST'] },
});
setIO(io);
io.on('connection', (socket) => {
    socket.on('join:restaurant', (restaurantId) => {
        socket.join(`restaurant:${restaurantId}`);
    });
});
app.use(helmet());
app.use(cors({ origin: config.frontendUrl }));
app.use(express.json());
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 1000,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (_req, res) => {
        res.status(429).json({ error: 'Too many requests. Please wait a moment and try again.' });
    },
});
app.use('/api/', limiter);
app.get('/health', (_req, res) => res.json({ status: 'ok' }));
app.use('/api/auth', authRoutes);
app.use('/api/restaurants', restaurantRoutes);
app.use('/api/queue', queueRoutes);
app.use('/api/tables', tableRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/whatsapp', whatsappRoutes);
app.use('/api/webhooks/whatsapp', whatsappRoutes);
app.use('/api/superadmin', superadminRoutes);
app.use('/api/payments', paymentRoutes);
async function start() {
    await connectDB();
    await runSeed(true);
    httpServer.listen(config.port, () => {
        console.log(`Smart Waitlist API running on http://localhost:${config.port}`);
    });
}
start().catch(console.error);
