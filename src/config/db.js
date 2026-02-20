import mongoose from 'mongoose';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const connectDB = async (retryCount = 0) => {
    const uri = process.env.MONGODB_URI;

    if (!uri) {
        throw new Error('MONGODB_URI is missing. Add it to your environment variables.');
    }

    try {
         console.log("Connecting to Mongo…");
        const conn = await mongoose.connect(uri, {
            serverSelectionTimeoutMS: 10000
        });
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        const delay = Math.min(30000, (retryCount + 1) * 5000);
        console.error("MongoDB Connection Error:", error.message);
        console.log(`Retrying MongoDB connection in ${delay / 1000}s...`);
        await sleep(delay);
        return connectDB(retryCount + 1);
    }
};

export default connectDB;
