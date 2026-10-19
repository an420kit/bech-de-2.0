// Public browser configuration only.
// Safe values: Supabase project URL + publishable key (sb_publishable_...) or legacy anon key.
// NEVER place sb_secret_... or service_role keys in browser code.
window.BECHDE_CONFIG = {
  supabaseUrl: "https://osalvxajhkgisxisntww.supabase.co",
  supabaseAnonKey: "sb_publishable_knqp6Rwhz6ELshSEI_Q_oQ_vG4CFcXA"
};
window.BECHDE_BACKEND_ENABLED =
  !!window.BECHDE_CONFIG.supabaseUrl &&
  window.BECHDE_CONFIG.supabaseUrl.startsWith("https://") &&
  !!window.BECHDE_CONFIG.supabaseAnonKey &&
  !window.BECHDE_CONFIG.supabaseAnonKey.startsWith("sb_secret_");