// Supabaseの設定
// Dashboard > Project Settings > API からコピーしてください。
// GitHub Pagesに公開するのは anon / publishable key です。
// service_role key は絶対に入れないでください。

const SUPABASE_URL = "https://ghuivkwpfeswjmefwwai.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdodWl2a3dwZmVzd2ptZWZ3d2FpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg2MDQwMjUsImV4cCI6MjEwNDE4MDAyNX0.o3tULJESEHZjjpp6X4VjsTpYnEvrU8gOI2nfy9FXvSE";

function isSupabaseConfigured() {
  return SUPABASE_URL &&
    SUPABASE_ANON_KEY &&
    !SUPABASE_URL.includes("https://ghuivkwpfeswjmefwwai.supabase.co") &&
    !SUPABASE_ANON_KEY.includes("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdodWl2a3dwZmVzd2ptZWZ3d2FpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg2MDQwMjUsImV4cCI6MjEwNDE4MDAyNX0.o3tULJESEHZjjpp6X4VjsTpYnEvrU8gOI2nfy9FXvSE");
}
