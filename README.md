# 大人の小中学力テスト

GitHub Pagesで公開できる、4択式120問のWebテストです。

## 構成
- 英語20問 / 6分
- 算数20問 / 6分
- 国語20問 / 6分
- 社会20問 / 6分
- 理科20問 / 6分
- 音楽10問 / 6分
- 美術10問 / 6分
- 合計120点
- 教科ごとに時間切れで自動提出
- 自動採点
- 正答一覧
- 教科別レーダーチャート
- 名前登録
- ランキング

## GitHub Pagesだけで動かす
index.html / app.js / styles.css / questions.js を同じフォルダに置けばOKです。
Supabaseを設定しない場合、ランキングはlocalStorageを使った「その端末だけのランキング」になります。

## インターネット上で全員共通のランキングにする
1. Supabaseで無料プロジェクトを作る
2. SQL Editorで supabase.sql を実行
3. Project Settings > API から Project URL と anon public key を取得
4. app.js 冒頭の
   SUPABASE_URL
   SUPABASE_ANON_KEY
   を置き換える
5. 5ファイルをGitHubリポジトリへアップロード
6. Settings > Pages > Deploy from branch > main / root を選択

## 注意
anon keyはブラウザ公開前提のキーです。service_role keyは絶対にapp.jsへ入れないでください。
