// C:\Users\PC_User\poster-map\src\lib\supabaseClient.ts

import { createClient } from '@supabase/supabase-js';

// 環境変数からSupabaseのURLとAnonキーを取得
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// 環境変数が設定されていない場合にエラーを投げる
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("SupabaseのURLまたはAnonキーが.env.localファイルに設定されていません。");
}

// Supabaseクライアントを作成してエクスポート
export const supabase = createClient(supabaseUrl, supabaseAnonKey);