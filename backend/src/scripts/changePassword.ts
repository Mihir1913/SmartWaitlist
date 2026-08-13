import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import { config } from '../config/index.js';

async function main() {
  const email = process.argv[2];
  const newPassword = process.argv[3];

  if (!email || !newPassword) {
    console.error('Usage: npx tsx src/scripts/changePassword.ts <email> <new_password>');
    process.exit(1);
  }

  try {
    await mongoose.connect(config.mongoUri);
    const user = await User.findOne({ email: email.toLowerCase() });
    
    if (!user) {
      console.error(`User with email ${email} not found.`);
      process.exit(1);
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
    
    console.log(`✅ Password for ${email} (${user.role}) has been updated successfully!`);
    process.exit(0);
  } catch (err) {
    console.error('Failed to update password:', err);
    process.exit(1);
  }
}

main();
