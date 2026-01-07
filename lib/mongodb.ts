import mongoose, { Mongoose } from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI as string;
if (!MONGODB_URI) {
  throw new Error("Please define the MONGODB_URI environment variable");
}

interface MongooseCache {
  conn: Mongoose | null;
  promise: Promise<Mongoose> | null;
}

let cached: MongooseCache = global.mongoose;
if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

const connectToDB = async (): Promise<Mongoose> => {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const connOptions: mongoose.ConnectOptions = {
      dbName: "GenAIChat",
      serverApi: {
        version: "1",
        strict: true,
        deprecationErrors: true,
      },
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(MONGODB_URI, connOptions).then((mongoose) => {
      console.log("MongoDB is connected");
      return mongoose;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (error) {
    cached.promise = null;
    throw error;
  }

  return cached.conn;
};

export default connectToDB;