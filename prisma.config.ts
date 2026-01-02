const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
import { defineConfig } from "prisma/config";

// Explicitly load .env
const envPath = path.resolve(__dirname, '.env');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
  console.log(`Loaded env from: ${envPath}`);
} else {
  console.log('No .env file found');
}

// Debug logs (masking secrets)
const url = process.env["POSTGRES_PRISMA_URL"] || process.env["DATABASE_URL"];
console.log(`DATABASE_URL length: ${url ? url.length : 'undefined'}`);

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: url || "", // Provide empty string default to fail later instead of config validation
  },
});
