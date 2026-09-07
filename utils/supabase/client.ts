import { createClient } from "@supabase/supabase-js";
import { projectId, publicAnonKey } from "./info";

export const supabase = createClient(
  `https://${projectId}.supabase.co`,
  publicAnonKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storageKey: "atlas_session",
    },
  }
);

export type { User, Session } from "@supabase/supabase-js";
