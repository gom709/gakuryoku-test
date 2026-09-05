// Supabaseの設定
// Dashboard > Project Settings > API からコピーしてください。
// GitHub Pagesに公開するのは anon / publishable key です。
// service_role key は絶対に入れないでください。

const SUPABASE_URL = "YOUR_SUPABASE_URL";
const SUPABASE_ANON_KEY = "YOUR_SUPABASE_ANON_KEY";

function isSupabaseConfigured() {
  return SUPABASE_URL &&
    SUPABASE_ANON_KEY &&
    !SUPABASE_URL.includes("YOUR_SUPABASE_URL") &&
    !SUPABASE_ANON_KEY.includes("YOUR_SUPABASE_ANON_KEY");
}
