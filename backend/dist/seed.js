import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import { config } from './config/index.js';
import { runSeed } from './services/seedService.js';
async function seed() {
    await mongoose.connect(config.mongoUri);
    console.log('Connected to MongoDB for seeding...');
    await runSeed(true);
    await mongoose.disconnect();
}
seed().catch(console.error);
