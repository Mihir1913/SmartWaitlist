import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { User } from '../models/User.js';
import { config } from '../config/index.js';
import { runSeed, clearDummyData } from '../services/seedService.js';
const router = Router();
const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(1),
});
router.post('/login', async (req, res) => {
    try {
        const { email, password } = loginSchema.parse(req.body);
        // Case-insensitive email lookup
        const user = await User.findOne({ email: { $regex: new RegExp(`^${email.trim()}$`, 'i') } });
        if (!user)
            return res.status(401).json({ error: 'Invalid credentials' });
        const valid = await bcrypt.compare(password, user.password);
        if (!valid)
            return res.status(401).json({ error: 'Invalid credentials' });
        const token = jwt.sign({ id: user._id, restaurantId: user.restaurantId, role: user.role }, config.jwtSecret, { expiresIn: '7d' });
        res.json({
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                restaurantId: user.restaurantId,
            },
        });
    }
    catch (err) {
        if (err instanceof z.ZodError) {
            return res.status(400).json({ error: err.errors });
        }
        res.status(500).json({ error: 'Login failed' });
    }
});
// Endpoint to trigger initial seed (useful for production deployment)
router.all('/seed', async (req, res) => {
    try {
        const force = req.query.force === 'true' || req.body?.force === true;
        const seeded = await runSeed(force);
        res.json({
            message: seeded ? 'Database seeded cleanly' : 'Database already seeded',
            seeded,
        });
    }
    catch (err) {
        console.error('Seed route error:', err);
        res.status(500).json({ error: 'Failed to seed database' });
    }
});
// Endpoint to wipe dummy queue entries, orders, and reset table statuses
router.all('/clear-dummy', async (req, res) => {
    try {
        await clearDummyData();
        res.json({ message: 'All dummy waitlist entries and orders cleared cleanly!' });
    }
    catch (err) {
        console.error('Clear dummy route error:', err);
        res.status(500).json({ error: 'Failed to clear dummy data' });
    }
});
export default router;
