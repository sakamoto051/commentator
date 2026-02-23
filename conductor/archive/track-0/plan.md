# Track 0: Project Foundation & MVP Backend

## Goal
Chrome拡張機能の基盤と、AWS Lambda/DynamoDBを使用したコメント管理APIの最小構成を構築する。

## Tasks
- [ ] **Setup Frontend**
    - Vite (React + TypeScript) を使用した拡張機能プロジェクトの初期化。
    - Manifest V3の設定。
    - YouTubeの動画IDをコンソールに出力するだけの `content-script` 実装。
- [ ] **Setup Backend (AWS)**
    - AWS CDK (TypeScript) を使用したプロジェクトの初期化。
    - DynamoDBテーブル定義 (`video_id` PK, `playback_time_ms` SK)。
    - Lambda Function URLs を使用したコメント投稿用エンドポイントの実装。
    - Lambda Function URLs を使用したコメント取得用エンドポイントの実装。
- [ ] **Verification**
    - `curl` または Postman による API の動作確認。
    - YouTube上で拡張機能が読み込まれ、動画IDが取得できることの確認。

## Technical Notes
- **Lambda Function URLs**: 今回は認証なしのパブリック設定から始め、必要に応じて `CORS` 設定を追加する。
- **DynamoDB Query**: コメント取得時は `Between` 演算子を使用して、特定の再生時間範囲のデータを効率的に取得する。
