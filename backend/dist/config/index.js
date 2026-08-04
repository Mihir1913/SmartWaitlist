import dotenv from 'dotenv';
dotenv.config();
export const config = {
    port: parseInt(process.env.PORT || '3001', 10),
    mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/smart-waitlist',
    jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-me',
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
    whatsappPhone: process.env.WHATSAPP_PHONE || '919876543210',
};
