import mongoose from 'mongoose';

async function connectToMongoose() {
  const mongoUrl = process.env.MONGO_URL;

  if (!mongoUrl) {
    throw new Error('MONGO_URL not found');
  }

  await mongoose.connect(mongoUrl, {
    directConnection: true,
  });

  return mongoose.connection;
}

async function flushMongoDb() {
  const mongooseCon = await connectToMongoose();
  const collections = await mongooseCon.listCollections();

  for (const collection of collections) {
    await mongooseCon.collection(collection.name).deleteMany({});
  }
}

beforeEach(async () => {
  await flushMongoDb();
});
