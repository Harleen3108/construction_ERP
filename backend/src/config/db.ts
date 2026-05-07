import mongoose from 'mongoose';

const connectDB = async (): Promise<void> => {
  try {
    const uri = process.env.MONGO_URI;
    if (!uri) throw new Error('MONGO_URI not defined in .env');

    const conn = await mongoose.connect(uri);
    console.log(`[DB] MongoDB Atlas connected: ${conn.connection.host}`);
  } catch (err: any) {
    console.error(`[DB] Connection error: ${err.message}`);
    process.exit(1);
  }
};

export default connectDB;
