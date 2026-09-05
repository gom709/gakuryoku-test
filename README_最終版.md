# 大人の小中学力テスト 完全検証版

## 今回の修正

前版で起きうる「index.htmlとapp.jsのID不一致」を解消し、HTML/JavaScriptを同一仕様で再構成しました。

さらに、Supabase未設定でもテスト本体は動くようにし、ランキング保存だけをSupabase依存にしています。

問題データの想定:
- 英語: 20問
- 数学: 20問
- 国語: 20問
- 社会: 20問
- 理科: 20問
- 音楽: 10問
- 美術: 10問
合計: 120問

## GitHub Pages

このZIPの中身をそのまま公開フォルダへアップロードしてください。

## config.js

以下を自分のSupabaseプロジェクトの値へ変更します。

```js
const SUPABASE_URL = "あなたのSupabase URL";
const SUPABASE_ANON_KEY = "あなたのanon key";
```

service_role keyは絶対に入れないでください。

## Supabase

1. Supabase Dashboard → SQL Editor
2. `supabase.sql` を丸ごと実行
3. Authentication → Users → Add user
4. 管理者メールアドレスとパスワードを登録
5. 作成したUser IDをコピー
6. SQL Editorで以下を実行

```sql
insert into public.profiles(id,role)
values ('ここにUser ID','admin')
on conflict(id) do update set role='admin';
```

「ここにUser ID」はメールアドレスではなく、Authentication → Usersに表示されるUUIDです。

## 管理画面

GitHub Pagesの

`admin.html`

を開いて、Supabase Authで作成した管理者アカウントでログインします。

## 重要

この版では、Supabaseが未設定でも受験画面は起動します。

ただし、Supabaseが未設定のままだと、

- 結果のDB保存
- 公開ランキング
- 管理画面の結果一覧

は利用できません。

## 動作確認

最初にブラウザで `index.html` を開き、

1. 名前を入力
2. テスト開始
3. 各科目6分
4. 全7科目
5. 結果画面
6. レーダーチャート
7. 正答一覧

まで確認してください。

その後、Supabaseを設定して再度受験し、ランキング保存を確認してください。

## セキュリティ

管理画面はSupabase Auth + RLSで保護しています。

ただし採点自体はブラウザ側なので、ブラウザを改変してスコアを偽装する余地は残っています。厳密な競技ランキングにする場合はサーバー側採点が必要です。
