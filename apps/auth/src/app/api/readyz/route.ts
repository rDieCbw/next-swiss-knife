import { mongoUri } from "@/lib/auth";
import { readyResponse } from "@swiss/observability";
import { MongoClient } from "mongodb";

export function GET() {
  return readyResponse("auth", {
    mongo: async () => {
      const client = new MongoClient(mongoUri, {
        serverSelectionTimeoutMS: 400,
      });
      try {
        await client.connect();
        await client.db(process.env.MONGODB_DB ?? "swiss").command({ ping: 1 });
      } finally {
        await client.close();
      }
    },
  });
}
