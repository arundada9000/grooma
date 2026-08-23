import { config } from "dotenv";

/**
 * Environment loader for standalone scripts (seed, migrations tooling).
 * Import this module BEFORE anything that reads process.env.
 * Next.js loads .env.local automatically; scripts do not.
 */
config({ path: ".env.local" });
config();
