import { mongodbAdapter } from "@better-auth/mongo-adapter";
import { betterAuth } from "better-auth";
import { magicLink, organization } from "better-auth/plugins";
import { MongoClient, type Db } from "mongodb";

export const defaultMongoUri = "mongodb://127.0.0.1:27017/swiss?replicaSet=rs0&directConnection=true";
export const mongoUri = process.env.MONGODB_URI ?? defaultMongoUri;

let client: MongoClient | undefined;
let database: Db | undefined;
let authInstance: ReturnType<typeof buildAuth> | undefined;
let connecting: Promise<void> | undefined;

function buildAuth(connectedClient: MongoClient, connectedDb: Db) {
  const googleId = process.env.GOOGLE_CLIENT_ID;
  const googleSecret = process.env.GOOGLE_CLIENT_SECRET;
  return betterAuth({
    baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:3001",
    secret: process.env.BETTER_AUTH_SECRET ?? "dev-only-secret-change-me-32chars-min",
    database: mongodbAdapter(connectedDb, { client: connectedClient }),
    emailAndPassword: { enabled: true },
    socialProviders: googleId && googleSecret ? { google: { clientId: googleId, clientSecret: googleSecret } } : undefined,
    trustedOrigins: [3000, 3001, 3002, 3003, 3004, 3005, 3006, 3007, 3008].map((port) => `http://localhost:${port}`),
    plugins: [
      organization(),
      ...(process.env.MAGIC_LINK_ENABLED === "true"
        ? [magicLink({ sendMagicLink: async ({ url }) => { console.info(`magic-link ${url}`); } })]
        : []),
    ],
  });
}

export function connectAuthDb() {
  if (!connecting) {
    connecting = (async () => {
      const connectedClient = new MongoClient(mongoUri);
      await connectedClient.connect();
      client = connectedClient;
      database = connectedClient.db(process.env.MONGODB_DB ?? "swiss");
      authInstance = buildAuth(connectedClient, database);
    })().catch((error: unknown) => {
      connecting = undefined;
      throw error;
    });
  }
  return connecting;
}

export function getAuth() {
  if (!authInstance || !client || !database) {
    throw new Error("connectAuthDb() must be awaited before using auth");
  }
  return authInstance;
}
