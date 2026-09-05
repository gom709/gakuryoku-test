# 大人の小中学力テスト 最終版セットアップ

## 1. GitHub Pagesへ配置

最終完成版ZIPの以下ファイルを、GitHub Pagesの公開フォルダへアップロードしてください。

- index.html
- questions.js
- app.js
- styles.css
- admin.html
- config.js
- supabase.sql

## 2. Supabaseの設定

Supabase Dashboardでプロジェクトを作成します。

Project Settings → API から以下を確認します。

- Project URL
- anon / publishable key

`config.js` を開き、以下を書き換えます。

```js
const SUPABASE_URL = "あなたのSupabase URL";
const SUPABASE_ANON_KEY = "あなたのanon key";
```

### 重要

`service_role` keyは絶対にGitHub Pagesへ置かないでください。

## 3. データベースとRLSを設定

Supabase DashboardのSQL Editorを開き、`supabase.sql` の内容を丸ごと貼り付けて実行します。

これにより以下が設定されます。

- profilesテーブル
- scoresテーブル
- 管理者判定
- RLS
- 公開ランキング用RPC

## 4. 管理者アカウントを作成

Supabase Dashboardの

Authentication → Users

から管理者用のメールアドレスとパスワードを登録します。

作成されたUser IDをコピーします。

SQL Editorで以下を実行してください。

```sql
insert into public.profiles (id, role)
values ('ここにUser ID', 'admin')
on conflict (id) do update set role='admin';
```

これで、そのアカウントだけが管理画面から全受験結果を閲覧できます。

## 5. index.html

`index.html` では、Supabase CDNの後、`questions.js` と `app.js` より前に `config.js` を読み込みます。

```html
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<script src="config.js"></script>
<script src="questions.js"></script>
<script src="app.js"></script>
```

最終完成版にはこの設定を反映済みです。

## 6. 受験者側

`index.html` を開くと、

名前入力
↓
英語
↓
数学
↓
国語
↓
社会
↓
理科
↓
音楽
↓
美術
↓
自動採点
↓
結果画面
↓
ランキング保存

という流れになります。

各科目の制限時間は6分です。

全7科目なので、最大42分です。

## 7. 管理者側

以下を開きます。

`admin.html`

管理者メールアドレスとパスワードでログインすると、

- 全受験者
- 受験日時
- 名前
- 総合点
- 科目別結果
- 名前検索
- CSV出力

を確認できます。

## 8. セキュリティ

以前のJavaScript内に管理キーを書く方式は使用しません。

今回の構成は、

管理者ログイン
↓
Supabase Auth
↓
profiles.role = admin
↓
RLS
↓
scores閲覧

という構成です。

一般受験者はログイン不要です。

また、一般ユーザーが直接`scores`の全データを閲覧できないようにし、公開ランキングには必要最低限の情報だけを返します。

## 9. 重要な注意

採点処理は現在ブラウザ側で行っています。

そのため、技術的にはブラウザのJavaScriptを改変して、不正な高得点を送信することは可能です。

今回のAuth + RLSで強化されるのは主に、

- 管理画面への不正アクセス
- データベースの無制限な閲覧
- 管理者権限の偽装

への対策です。

本格的なランキング大会などで「結果の改ざんを完全に防ぎたい」場合は、次の段階としてサーバー側採点に変更する必要があります。
