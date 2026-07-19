import { MongoClient } from "mongodb";

const MONGO_URI = "mongodb+srv://flavor_ai:YWnISzdjyCptC9rV@cluster0.xwtabrp.mongodb.net/?appName=Cluster0";

const run = async () => {
  const client = new MongoClient(MONGO_URI);
  try {
    await client.connect();
    console.log("Connected to MongoDB...");

    // List databases
    const adminDb = client.db().admin();
    const dbsList = await adminDb.listDatabases();
    console.log("Databases:");
    for (const dbInfo of dbsList.databases) {
      console.log(` - ${dbInfo.name}`);
    }

    // Connect to "flavor_ai" database
    const db = client.db("flavor_ai");
    const collections = await db.listCollections().toArray();
    console.log("Collections in flavor_ai:");
    for (const coll of collections) {
      console.log(` - ${coll.name}`);
    }

    // Try to update emailVerified in both "user" and "users" collection
    const targetEmail = "khalidhasan678954321@gmail.com";
    
    const userColl = db.collection("user");
    const usersColl = db.collection("users");

    const res1 = await userColl.updateMany(
      { email: targetEmail },
      { $set: { emailVerified: true } }
    );
    console.log(`Updated in 'user' collection: matched ${res1.matchedCount}, modified ${res1.modifiedCount}`);

    const res2 = await usersColl.updateMany(
      { email: targetEmail },
      { $set: { emailVerified: true } }
    );
    console.log(`Updated in 'users' collection: matched ${res2.matchedCount}, modified ${res2.modifiedCount}`);

    // If it's in the default test database
    const testDb = client.db("test");
    const testCollections = await testDb.listCollections().toArray();
    if (testCollections.length > 0) {
      console.log("Collections in test db:");
      for (const coll of testCollections) {
        console.log(` - ${coll.name}`);
      }
      const testUserColl = testDb.collection("user");
      const res3 = await testUserColl.updateMany(
        { email: targetEmail },
        { $set: { emailVerified: true } }
      );
      console.log(`Updated in test 'user' collection: matched ${res3.matchedCount}, modified ${res3.modifiedCount}`);
    }

  } catch (error) {
    console.error("Error:", error);
  } finally {
    await client.close();
    process.exit(0);
  }
};

run();
