import { PrismaClient } from "@prisma/client";
import invariant from "tiny-invariant";
import { singleton } from "./singleton.server";

// Check for DATABASE_URL environment variable
let DATABASE_URL = process.env.DATABASE_URL;

// If DATABASE_URL is not set, use a default value for demo purposes
if (!DATABASE_URL) {
  console.warn("DATABASE_URL not set, using default value for demo purposes");
  DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/cobotpro?schema=public';
  process.env.DATABASE_URL = DATABASE_URL;
}

// For Vercel deployment, we'll use Postgres
let prismaOptions = {};

// If we're in production (Vercel), add connection pooling options
if (process.env.NODE_ENV === 'production') {
  console.log('Using Postgres database for Vercel deployment');
  prismaOptions = {
    datasources: {
      db: {
        url: DATABASE_URL
      }
    },
    // Add connection pooling for better performance
    connection: {
      options: {
        min: 1,
        max: 10
      }
    }
  };
}

// Hard-code a unique key, so we can look up the client when this module gets re-imported
const prisma = singleton("prisma", () => new PrismaClient(prismaOptions));
prisma.$connect();

export { prisma };
