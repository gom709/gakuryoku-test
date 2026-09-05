# 大人の小中学力テスト 修正版セットアップ

## まずやること

このフォルダのファイルをGitHub Pagesへアップロードしてください。

- index.html
- questions.js
- app.js
- styles.css
- admin.html
- config.js
- supabase.sql

## 1. config.js

Supabase Dashboard → Project Settings → API からProject URLとanon/publishable keyを取得し、config.jsを書き換えます。

```js
const SUPABASE_URL = "あなたのSupabase URL";
const SUPABASE_ANON_KEY = "あなたのanon key";
```

service_role keyは絶対に入れないでください。

## 2. supabase.sql

Supabase Dashboard → SQL Editorで、supabase.sqlを丸ごと実行します。

## 3. 管理者アカウント

Supabase Dashboard → Authentication → Users → Add user からメールアドレスとパスワードで管理者を作成します。

作成したユーザーのUser IDをコピーします。

SQL Editorで以下を実行します。

```sql
insert into public.profiles(id,role)
values ('ここにUser ID','admin')
on conflict(id) do update set role='admin';
```

「ここにUser ID」はAuthentication → Usersで作成したユーザーのUUIDです。メールアドレスではありません。

## 4. GitHub Pages

既存ファイルは今回の修正版で上書きしてください。

questions.jsとstyles.cssも含めて丸ごとアップロードするのが安全です。

## 5. 動作確認

受験者:
index.html

管理者:
admin.html

各科目6分、7科目、全130問です。

## 6. 今回の修正点

前版でindex.htmlとapp.jsのHTML IDが一致していなかった問題を修正しました。

また、画面表示を130問・7科目・6分/科目の仕様に統一しています。

管理者画面はSupabase Auth + RLSで保護しています。

## 7. 注意

現在の採点はブラウザ側です。ブラウザを改変すればスコアを偽装できるため、ランキングを厳密な競技として運用する場合はサーバー側採点が必要です。
