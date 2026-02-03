// src/db/supabaseClient.ts
import { createClient } from "@supabase/supabase-js";
import { env, validateEnv } from "./envConfig.js";
// Validate environment variables
const isValid = validateEnv();
if (!isValid) {
    throw new Error("Missing Supabase credentials in environment variables.");
}
console.log("Creating Supabase client with URL:", env.SUPABASE_URL);
export const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY, {
    auth: {
        persistSession: false, // server-side, no session persistence needed
    },
});
console.log("✅ Supabase client created successfully");
export default supabase;
//# sourceMappingURL=supabaseClient.js.map