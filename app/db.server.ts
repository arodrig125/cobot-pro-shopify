import { PrismaClient } from "@prisma/client";
import invariant from "tiny-invariant";
import { singleton } from "./singleton.server";

// Check for DATABASE_URL environment variable
const DATABASE_URL = process.env.DATABASE_URL;
invariant(DATABASE_URL, "DATABASE_URL must be set in environment variables.");

// For Vercel deployment with SQLite, we need to handle the database connection differently
let prismaOptions = {};

// If we're using SQLite and in production (Vercel), use in-memory database
if (DATABASE_URL.startsWith('file:') && process.env.NODE_ENV === 'production') {
  console.log('Using in-memory SQLite database for Vercel deployment');
  prismaOptions = {
    datasources: {
      db: {
        url: 'file::memory:?cache=shared'
      }
    }
  };
}

// Hard-code a unique key, so we can look up the client when this module gets re-imported
const prisma = singleton("prisma", () => new PrismaClient(prismaOptions));
prisma.$connect();

export { prisma };
