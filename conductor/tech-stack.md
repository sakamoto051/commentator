# Tech Stack - Commentator

## Frontend (Chrome Extension)
- **Framework**: React + TypeScript
- **Build Tool**: Vite
- **Styling**: Vanilla CSS (Performance focused)
- **API Communication**: Fetch API

## Backend (AWS)
- **Computing**: AWS Lambda (Function URLs)
    - API Gatewayを使用せずコストを削減
- **Database**: DynamoDB (On-demand mode)
    - Partition Key: `video_id` (string)
    - Sort Key: `playback_time_ms` (number)
- **Infrastructure as Code**: AWS CDK or SAM (TBD)
- **Language**: TypeScript (Node.js runtime)

## Infrastructure Strategy
- **Caching**: 拡張機能内でのメモリキャッシュおよびローカルストレージ活用。
- **Cost**: 無料枠を最大限活用し、それを超えた場合も最小限の従量課金に抑える。
