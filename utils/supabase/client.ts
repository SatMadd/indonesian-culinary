import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let client: ReturnType<typeof createBrowserClient> | null = null;

// Safe no-op client used during build-time prerendering when env vars are unavailable.
// This prevents @supabase/ssr from throwing during `npm run build`.
const buildSafeClient = {
  auth: {
    getUser: async () => ({ data: { user: null }, error: null }),
    onAuthStateChange: () => ({
      data: { subscription: { unsubscribe: () => {} } },
    }),
    signOut: async () => {},
    signInWithPassword: async () => ({
      data: { user: null, session: null },
      error: { message: "Supabase belum dikonfigurasi. Periksa variabel lingkungan NEXT_PUBLIC_SUPABASE_URL dan NEXT_PUBLIC_SUPABASE_ANON_KEY." },
    }),
    signUp: async () => ({
      data: { user: null, session: null },
      error: { message: "Supabase belum dikonfigurasi. Periksa variabel lingkungan NEXT_PUBLIC_SUPABASE_URL dan NEXT_PUBLIC_SUPABASE_ANON_KEY." },
    }),
  },
  from: () => ({
    select: () => ({
      order: () => Promise.resolve({ data: [], error: null }),
      then: (cb: any) => cb({ data: [], error: null }),
    }),
    insert: () => ({ select: () => Promise.resolve({ data: null, error: null }) }),
  }),
} as any;

export const createClient = () => {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn("[Supabase] Missing env vars — returning safe fallback client.");
    return buildSafeClient;
  }
  if (!client) {
    client = createBrowserClient(supabaseUrl, supabaseAnonKey);
  }
  return client;
};
