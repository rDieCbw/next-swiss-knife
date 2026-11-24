import { MongoClient, type Db } from "mongodb";

let client: MongoClient | undefined;
let connecting: Promise<Db> | undefined;

export function mongoUri() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI is required");
  }
  return uri;
}

export async function getDb(): Promise<Db> {
  if (!connecting) {
    client = new MongoClient(mongoUri());
    connecting = client.connect().then(() => client!.db(process.env.MONGODB_DB ?? "swiss"));
  }
  return connecting;
}

export async function closeDb() {
  await client?.close();
  client = undefined;
  connecting = undefined;
}
