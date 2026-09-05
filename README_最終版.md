# 大人の小中学力テスト 完全修正版

## まず動作確認
Supabaseの設定は不要です。

1. このフォルダ内の `index.html` をブラウザで開く
2. 名前を入力
3. 「テスト開始」を押す
4. 「英語 1/7」が表示されれば開始成功

## GitHub Pages
このフォルダのファイルをGitHub Pagesで公開してください。

## Supabase
ランキングを使う場合のみ `config.js` に Supabase URL と anon / publishable key を設定し、
`supabase.sql` をSupabase SQL Editorで実行してください。

service_role key は `config.js` に入れないでください。

## 科目と問題数
英語20、算数20、国語20、社会20、理科20、音楽10、美術10、合計130問。
各科目6分です。
