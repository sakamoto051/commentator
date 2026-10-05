# Commentator
動画の再生時刻に同期したコメントを、プレイヤー上へ流して表示・投稿する Chrome 拡張機能です。YouTube、Netflix、Amazon Prime Video 向けのプラットフォーム別実装を含みます。

## 主な機能
- 再生位置に合わせたコメント表示と投稿
- 5分単位の取得・先読み、コメントの重複排除
- 入力フォームの位置・透過度などの調整
- プラットフォームごとの動画ID・プレイヤー検出

## 技術と構成
TypeScript / React 18 / Vite / Chrome Manifest V3 / AWS CDK / Lambda / DynamoDB / Playwright。
- [client/src/content-scripts](client/src/content-scripts): 動画検出、入力UI、コメント表示
- [client/public/manifest.json](client/public/manifest.json): 拡張権限と対象ページ
- [backend/lambda/comment.ts](backend/lambda/comment.ts): 時間範囲による取得・投稿 API
- [backend/lib/backend-stack.ts](backend/lib/backend-stack.ts): インフラ定義
- [docs](docs): 紹介ページとプライバシー説明
- [e2e](e2e): ブラウザ確認用テスト

## 実装上のポイント
動画サービスごとの差分を platform クラスに分離しています。コメントの先読みとキャッシュ、描画済みIDの管理により、シークや重複取得を扱う構成です。入力UIには Shadow DOM を使用しています。

## ローカルでのビルド
```sh
cd client
npm install
cp .env.example .env.local
# VITE_API_URL に自分の開発用APIのURLを設定
npm run build
```
Chrome の拡張機能管理画面で開発者モードを有効にし、生成された client/dist を読み込みます。権限と対象サイトを確認してから使用してください。VITE_* はブラウザに公開されるため、認証秘密を入れてはいけません。

バックエンドの静的確認:
```sh
cd backend
npm ci
npm run build
npm test -- --runInBand
```
AWS へのデプロイはアカウント設定・料金・権限確認が必要な別工程です。本手順では実行しません。

## 安全性と現状の制約
- 現行 CDK の Function URL は認証なし、CORS は広く許可する開発用構成です。一般公開前に認証・投稿制限・濫用対策を検討してください。
- DynamoDB はスタック削除時に消える設定です。運用データを保存する前に保持方針を変更してください。
- Lambda でリクエスト全文をログへ残さないようにしています。コメント本文や認証情報をログへ追加しないでください。
- 動画サービスの DOM 変更で動作が変わり得ます。サービスごとの実機確認、ストア審査状況、稼働中APIの提供は本 README では保証しません。
- 生成ZIPとテスト成果物を現行ツリーから除外しています。過去のコミットや既存配布物は別途確認が必要です。
