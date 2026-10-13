import mongoose from 'mongoose';

export async function connectMongo(uri, logger) {
  try {
    mongoose.set('strictQuery', false);
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000,
    });
    logger.info({ uri: uri.replace(/:([^:@]+)@/, ':****@') }, 'Connected to MongoDB Atlas / Database');
  } catch (err) {
    logger.error({ err }, 'Failed to connect to MongoDB');
    throw err;
  }

  mongoose.connection.on('error', (err) => {
    logger.error({ err }, 'MongoDB connection error');
  });

  mongoose.connection.on('disconnected', () => {
    logger.warn('MongoDB connection lost');
  });

  return {
    async ping() {
      if (mongoose.connection.readyState !== 1) {
        throw new Error('MongoDB connection is not ready');
      }
      return mongoose.connection.db.admin().ping();
    },
    async close() {
      await mongoose.disconnect();
    },
    connection: mongoose.connection,
  };
}
