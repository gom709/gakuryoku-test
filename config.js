// Supabase設定
// Dashboard > Project Settings > API からURLと anon / publishable keyを設定してください。
// service_role key は絶対にGitHub Pagesへ公開しないでください。

window.SUPABASE_URL = "YOUR_SUPABASE_URL";
window.SUPABASE_ANON_KEY = "YOUR_SUPABASE_ANON_KEY";

window.isSupabaseConfigured = function () {
  return Boolean(
    window.SUPABASE_URL &&
    window.SUPABASE_ANON_KEY &&
    !window.SUPABASE_URL.includes("YOUR_SUPABASE_URL") &&
    !window.SUPABASE_ANON_KEY.includes("YOUR_SUPABASE_ANON_KEY")
  );
};
