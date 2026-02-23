# Commentator Product Definition

NetflixやYouTubeなどの動画プラットフォームにおいて、特定の再生時間にコメントを同期させて表示・投稿できるChrome拡張機能。

## Core Values
- **Shared Experience**: リアルタイムではない動画視聴において、他のユーザーとの時間軸に沿った共体験を提供する。
- **Lightweight**: 動画視聴の邪魔をせず、低レイテンシでコメントを表示する。
- **Cost Efficiency**: 個人開発として持続可能なよう、インフラコストを極限まで抑える。

## Key Features
1. **Time-synced Comments**: 再生時間（ミリ秒単位）に紐づいたコメントを表示。
2. **Comment Overlay**: 動画プレイヤー上にニコニコ動画風（またはカスタマイズ可能）にコメントをオーバーレイ。
3. **In-video Posting**: 動画を視聴しながら、現在の再生位置に対して即座にコメントを投稿。
4. **Smart Loading**: チャンク（5分単位など）によるコメントの先読み・効率的な取得。

## Platforms
- Chrome Extension (Manifest V3)
- Target Sites: YouTube, Netflix (Initial support)
