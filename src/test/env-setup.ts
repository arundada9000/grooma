import { config } from "dotenv";

// Loaded before any test module imports code that reads process.env at
// module scope (src/db/index.ts throws without DATABASE_URL).
config({ path: ".env.local", quiet: true });
config({ quiet: true });
