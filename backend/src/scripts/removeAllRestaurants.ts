import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import { config } from '../config/index.js';
import { removeAllRestaurantsData } from '../services/seedService.js';

async function main() {
  await mongoose.connect(config.mongoUri);
  console.log('Connected to MongoDB for wiping all restaurant data...');
  await removeAllRestaurantsData();
  await mongoose.disconnect();
  console.log('MongoDB connection closed.');
}

main().catch(err => {
  console.error('Error wiping restaurant data:', err);
  process.exit(1);
});
