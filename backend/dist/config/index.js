import dotenv from 'dotenv';
dotenv.config();
export const config = {
    port: parseInt(process.env.PORT || '3001', 10),
    mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/smart-waitlist',
    jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-me',
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
    whatsappPhone: process.env.WHATSAPP_PHONE || '919876543210',
    whatsappAccessToken: process.env.WHATSAPP_ACCESS_TOKEN || '',
    whatsappPhoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || '',
    whatsappVerifyToken: process.env.WHATSAPP_VERIFY_TOKEN || 'serva_smart_waitlist_verify_token',
    whatsappBusinessAccountId: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID || '',
    whatsappApiVersion: process.env.WHATSAPP_API_VERSION || 'v19.0',
    superAdminEmail: process.env.SUPERADMIN_EMAIL || 'admin@smartwaitlist.com',
    superAdminPassword: process.env.SUPERADMIN_PASSWORD || 'IQ_SmartWaitList$2026@',
};
