// lib/mongodb.js
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' }); // Ensures environment variables are loaded

import mongoose from 'mongoose';

// Debug: See what is loaded (optional, remove after debug)
console.log('[mongodb.js] Loaded MONGODB_URI:', process.env.MONGODB_URI);

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable in your .env.local');
}

// Use a global cache to prevent re-connecting during hot reloads (recommended for Next.js)
let cached = global.mongoose;
if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function dbConnect() {
  if (cached.conn) {
    return cached.conn;
  }
  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
      // The URI already contains the DB name, so no dbName needed
    }).then((mongoose) => {
      console.log('✅ Connected to Dinar-Exchange database!');
      return mongoose;
    });
  }
  cached.conn = await cached.promise;
  return cached.conn;
}

export default dbConnect;
