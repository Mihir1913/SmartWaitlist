import geoip from 'geoip-lite';
import { AuditLog } from '../models/AuditLog.js';
import { User } from '../models/User.js';
export function auditLogger(req, res, next) {
    // We hook into the 'finish' event to ensure we capture the final status code
    // and any user info populated by auth middlewares.
    res.on('finish', async () => {
        // Skip logging for OPTIONS requests or frequent polling if desired. 
        // Here we log everything except OPTIONS.
        if (req.method === 'OPTIONS')
            return;
        try {
            const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
            let cleanIp = ipAddress.split(',')[0].trim();
            // Handle local IPs for demo/testing
            if (cleanIp === '::1' || cleanIp === '127.0.0.1') {
                cleanIp = '127.0.0.1'; // local
            }
            const geo = geoip.lookup(cleanIp);
            const location = geo ? `${geo.city || 'Unknown City'}, ${geo.country || 'Unknown Country'}` : 'Local/Unknown';
            // Capture action (e.g., "POST /api/auth/login")
            const action = `${req.method} ${req.originalUrl.split('?')[0]}`;
            // Extract User Info if populated by authMiddleware
            let userEmail = undefined;
            let userRole = undefined;
            let userId = undefined;
            let restaurantId = undefined;
            if (req.user) {
                userId = req.user.id;
                restaurantId = req.user.restaurantId;
                userRole = req.user.role;
                // Fetch email if we want it in the log immediately
                const user = await User.findById(userId).select('email');
                if (user) {
                    userEmail = user.email;
                }
            }
            else if (req.body && req.body.email) {
                // Special case: login attempt
                userEmail = req.body.email;
                userRole = 'guest/login-attempt';
            }
            await AuditLog.create({
                action,
                method: req.method,
                path: req.originalUrl.split('?')[0],
                statusCode: res.statusCode,
                ipAddress: cleanIp,
                location,
                userEmail,
                userRole,
                userId,
                restaurantId,
            });
        }
        catch (err) {
            console.error('Failed to write audit log:', err);
        }
    });
    next();
}
