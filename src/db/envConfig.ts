// src/db/envConfig.ts
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from 'url';

// Get the current file's directory (ESM way)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Go up from src/db -> src -> backendcode -> project0001 -> .env
const envPath = path.resolve(__dirname, '../../.env');
console.log("Looking for .env at:", envPath);

// Load the .env file
const result = dotenv.config({ path: envPath });

if (result.error) {
  console.error("❌ Error loading .env:", result.error.message);
} else if (result.parsed) {
  console.log("✅ .env file loaded successfully");
  console.log("Found variables:", Object.keys(result.parsed));
}

// Debug: Show what's actually loaded
console.log("\n=== Current process.env ===");
console.log("SUPABASE_URL:", process.env.SUPABASE_URL || "UNDEFINED");
console.log("SUPABASE_SERVICE_KEY:", (process.env.SUPABASE_SERVICE_KEY || "UNDEFINED").substring(0, 10) + "...");
console.log("PAYSTACK_KEY:", (process.env.PAYSTACK_SECRET_KEY || "UNDEFINED").substring(0, 5) + "...");
console.log("RESEND_KEY:", (process.env.RESEND_API_KEY || "UNDEFINED").substring(0, 5) + "...");


// Create env object with defaults
export const env = {
  SUPABASE_URL: (process.env.SUPABASE_URL || "").trim(),
  SUPABASE_SERVICE_KEY: (process.env.SUPABASE_SERVICE_KEY || "").trim(),
  PORT: (process.env.PORT || "3001").trim(),
  NODE_ENV: ((process.env.NODE_ENV as "development" | "production" | "test") || "development"),
  CORS_ORIGIN: (process.env.CORS_ORIGIN || "http://localhost:5174").trim(),
  BASE_URL: (process.env.BASE_URL || "http://localhost:3001").trim(),
  DATABASE_URL: (process.env.DATABASE_URL || "").trim(),
  JWT_SECRET: (process.env.JWT_SECRET || "").trim(),
  CLOUDINARY_CLOUD_NAME: (process.env.CLOUDINARY_CLOUD_NAME || "").trim(),
  CLOUDINARY_API_KEY: (process.env.CLOUDINARY_API_KEY || "").trim(),
  CLOUDINARY_API_SECRET: (process.env.CLOUDINARY_API_SECRET || "").trim(),
  PAYSTACK_SECRET_KEY: (process.env.PAYSTACK_SECRET_KEY || "").trim(),
  RESEND_API_KEY: (process.env.RESEND_API_KEY || "").trim(),
};


// Validation function
export const validateEnv = () => {
  console.log("\n=== Validating Environment ===");

  const required = [
    'SUPABASE_URL',
    'SUPABASE_SERVICE_KEY',
    'JWT_SECRET',
    'PAYSTACK_SECRET_KEY',
    'RESEND_API_KEY'
  ];


  for (const key of required) {
    if (!env[key as keyof typeof env]) {
      console.error(`❌ ${key} is missing`);
      return false;
    }
  }

  console.log("✅ All required environment variables are present");
  console.log(`📁 NODE_ENV: ${env.NODE_ENV}`);
  console.log(`🚪 PORT: ${env.PORT}`);
  console.log(`🌐 CORS_ORIGIN: ${env.CORS_ORIGIN}`);
  return true;
};