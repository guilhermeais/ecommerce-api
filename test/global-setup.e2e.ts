import {
  MongoDBContainer,
  StartedMongoDBContainer,
} from '@testcontainers/mongodb';

let mongoContainer: StartedMongoDBContainer;

async function startMongoDB() {
  console.log('⌛ Starting MongoDBContainer...');

  mongoContainer = await new MongoDBContainer().start();

  process.env.MONGO_URL = `${mongoContainer.getConnectionString()}?directConnection=true`;

  console.log(`🚀 MongoDBContainer started at ${process.env.MONGO_URL}`);
}

async function stopMongoDB() {
  console.log('⌛ Stopping MongoDBContainer...');
  await mongoContainer.stop();
  console.log('💤 MongoDBContainer stopped');
}

export async function setup() {
  await startMongoDB();
}

export async function teardown() {
  await stopMongoDB();
}
