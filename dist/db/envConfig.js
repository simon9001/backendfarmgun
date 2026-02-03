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
}
else if (result.parsed) {
    console.log("✅ .env file loaded successfully");
    console.log("Found variables:", Object.keys(result.parsed));
}
// Debug: Show what's actually loaded
console.log("\n=== Current process.env ===");
console.log("SUPABASE_URL:", process.env.SUPABASE_URL || "UNDEFINED");
console.log("SUPABASE_SERVICE_KEY:", process.env.SUPABASE_SERVICE_KEY || "UNDEFINED");
// Create env object with defaults
export const env = {
    SUPABASE_URL: process.env.SUPABASE_URL || "",
    SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_KEY || "",
    PORT: process.env.PORT || "3001",
    NODE_ENV: process.env.NODE_ENV || "development",
    CORS_ORIGIN: process.env.CORS_ORIGIN || "http://localhost:5174",
    DATABASE_URL: process.env.DATABASE_URL || "",
    JWT_SECRET: process.env.JWT_SECRET || "",
    CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME || "",
    CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY || "",
    CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET || "",
};
// Validation function
export const validateEnv = () => {
    console.log("\n=== Validating Environment ===");
    if (!env.SUPABASE_URL) {
        console.error("❌ SUPABASE_URL is missing");
        return false;
    }
    if (!env.SUPABASE_SERVICE_KEY) {
        console.error("❌ SUPABASE_SERVICE_KEY is missing");
        return false;
    }
    console.log("✅ All required environment variables are present");
    console.log(`📁 NODE_ENV: ${env.NODE_ENV}`);
    console.log(`🚪 PORT: ${env.PORT}`);
    console.log(`🌐 CORS_ORIGIN: ${env.CORS_ORIGIN}`);
    return true;
};
//# sourceMappingURL=envConfig.js.map