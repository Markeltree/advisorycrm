import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { loadConfig } from '../src/config.js';
import { connectMongo } from '../src/db/mongo.js';
import { createLogger } from '../src/logger.js';
import { User } from '../src/models/User.js';

const email = process.argv[2];
const password = process.argv[3];
const fullName = process.argv[4] || 'Advisor User';
const role = process.argv[5] || 'advisor';

if (!email || !password) {
  console.log('Usage: node scripts/create-user-mongo.js <email> <password> [fullName] [role]');
  process.exit(1);
}

async function run() {
  const config = loadConfig();
  const logger = createLogger('info');
  const db = await connectMongo(config.MONGODB_URI, logger);

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    console.error(`User with email "${email}" already exists.`);
    await db.close();
    process.exit(1);
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await User.create({
    email: email.toLowerCase(),
    password: hashedPassword,
    fullName,
    role,
    isActive: true,
  });

  console.log(`User created successfully with ID: ${user.id}`);
  await db.close();
  process.exit(0);
}

run().catch((err) => {
  console.error('Failed to create user:', err);
  process.exit(1);
});
