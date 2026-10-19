// Public browser configuration only. Replace these with your Supabase project values.
// Never put a Supabase service_role key or payment secret here.
window.BECHDE_CONFIG = {
  supabaseUrl: "https://YOUR_PROJECT_REF.supabase.co",
  supabaseAnonKey: "YOUR_SUPABASE_PUBLISHABLE_OR_ANON_KEY"
};
window.BECHDE_BACKEND_ENABLED =
  !!window.BECHDE_CONFIG.supabaseUrl &&
  !window.BECHDE_CONFIG.supabaseUrl.includes("YOUR_PROJECT_REF") &&
  !!window.BECHDE_CONFIG.supabaseAnonKey &&
  !window.BECHDE_CONFIG.supabaseAnonKey.includes("YOUR_SUPABASE");
