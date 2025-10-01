# Team Calendar Switcher

Googleカレンダー上でチームのカレンダーを簡単に切り替えられるChrome拡張機能

## 概要

この拡張機能は、Googleカレンダーのサイドパネルに統合され、チームメンバーのfree/busy情報を視覚的に表示します。

### 主な機能

- **コンパクトなチーム切り替え**: ピル型UIで素早くチームを切り替え
- **Googleカレンダー連携**: チーム切り替え時に自動でメンバーカレンダーを表示
- **Free/Busyヒートマップ**: 時間帯ごとのチームメンバーの予定状況を色分け表示
- **候補時間提示**: 最も多くのメンバーが空いている時間帯を自動提案（上位3候補）
- **柔軟な時間表示**: 15分/30分/60分単位でスロットを切り替え可能
- **アクセス管理**: 権限のないメンバーを自動除外し、統計を表示

## アーキテクチャ

### 設計パターン

- **TeamProvider抽象化**: チームメンバー取得ロジックを分離し、将来の拡張に対応
  - `ManualListProvider`: 手入力メンバーリスト（MVP実装）
  - `GoogleGroupProvider`: Googleグループ展開（スタブ実装）
  - `RemoteDirectoryProvider`: 社内API連携（将来実装）

- **FreeBusyService**: Google Calendar APIを効率的に利用
  - バッチ処理（最大30人/リクエスト）
  - スロット丸め処理
  - メモリキャッシュ（TTL: 60秒）

- **StorageRepository**: `chrome.storage.sync`による永続化
  - 将来的にFirestoreなどに置き換え可能

- **CalendarListService**: Google Calendar List APIを使用したカレンダー管理
  - カレンダーの購読・購読解除
  - 表示/非表示の切り替え

- **TeamSwitchService**: チーム切り替え時のカレンダー同期を管理
  - 前のチームのカレンダーを自動で非表示
  - 新しいチームのカレンダーを自動で表示

### ディレクトリ構成

```
team-cal/
├── src/
│   ├── types/              # TypeScript型定義
│   │   ├── domain.ts       # ドメインモデル
│   │   ├── providers.ts    # プロバイダインターフェース
│   │   └── storage.ts      # ストレージインターフェース
│   ├── services/           # ビジネスロジック
│   │   ├── providers/      # TeamProviderの実装
│   │   │   ├── ManualListProvider.ts
│   │   │   └── GoogleGroupProvider.ts
│   │   ├── FreeBusyService.ts
│   │   └── StorageRepository.ts
│   ├── auth/               # 認証
│   │   └── GoogleAuthService.ts
│   ├── background/         # Service Worker
│   │   └── service-worker.ts
│   └── panel/              # React UI
│       ├── components/
│       │   ├── TeamViewSelect.tsx
│       │   ├── TeamViewEditor.tsx
│       │   ├── TimeRangePicker.tsx
│       │   ├── Heatmap.tsx
│       │   └── TopCandidates.tsx
│       ├── App.tsx
│       ├── App.css
│       └── main.tsx
├── public/
│   └── manifest.json
├── package.json
├── vite.config.ts
├── vitest.config.ts
└── README.md
```

## セットアップ

### 前提条件

- Node.js 18以上
- npm または yarn
- Google Cloud Projectの作成とOAuth設定

### 1. 依存関係のインストール

```bash
npm install
```

### 2. Google Cloud Projectの設定

#### 2.1 Google Cloud Consoleでプロジェクト作成

1. [Google Cloud Console](https://console.cloud.google.com/)にアクセス
2. 新しいプロジェクトを作成
3. "APIs & Services" > "Credentials"に移動

#### 2.2 OAuth 2.0クライアントIDの作成

1. "CREATE CREDENTIALS" > "OAuth client ID"をクリック
2. Application type: "Chrome extension"を選択
3. Name: "Team Calendar Extension"
4. Extension ID: 後で取得（後述）
5. 作成後、Client IDをコピー

#### 2.3 必要なAPIの有効化

以下のAPIを有効化してください：

- Google Calendar API
- Google People API（userinfo.email用）

### 3. 拡張機能IDの取得

1. ビルドを実行:
```bash
npm run build
```

2. Chromeで `chrome://extensions/` を開く
3. "デベロッパーモード"を有効化
4. "パッケージ化されていない拡張機能を読み込む"をクリック
5. `dist`フォルダを選択
6. 表示された拡張機能IDをコピー

### 4. manifest.jsonの更新

`public/manifest.json`を編集：

```json
{
  "oauth2": {
    "client_id": "YOUR_CLIENT_ID.apps.googleusercontent.com",
    "scopes": [
      "https://www.googleapis.com/auth/calendar",
      "https://www.googleapis.com/auth/calendar.freebusy",
      "https://www.googleapis.com/auth/userinfo.email"
    ]
  }
}
```

### 5. Google Cloud ConsoleでExtension IDを設定

1. OAuth 2.0クライアントIDの設定に戻る
2. "Authorized JavaScript origins"に拡張機能IDを追加:
   ```
   chrome-extension://YOUR_EXTENSION_ID
   ```
3. 保存

### 6. 再ビルドと読み込み

```bash
npm run build
```

Chromeで拡張機能をリロードしてください。

## 開発

### 開発モード（ウォッチモード）

```bash
npm run dev
```

ファイル変更時に自動ビルドされます。

### テストの実行

```bash
# 単体テスト実行
npm test

# ウォッチモード
npm test -- --watch

# UIモード
npm run test:ui
```

### プロダクションビルド

```bash
npm run build
```

`dist/`フォルダに成果物が生成されます。

## 使い方

### 1. チームビューの作成

1. 拡張機能のサイドパネルを開く
2. "+"ボタンをクリック
3. チーム名を入力
4. メンバーのメールアドレスを入力（1行に1人）
   ```
   user1@example.com,山田太郎
   user2@example.com,佐藤花子
   ```
5. "保存"をクリック

### 2. チームの切り替えとカレンダー表示

1. ピル型ボタンからチームを選択
2. 自動的にメンバーのカレンダーがGoogleカレンダーに追加されます
3. 同期完了後、Googleカレンダーでメンバーの予定が確認できます

### 3. 空き状況の表示

1. 時間範囲を選択（今日/今週/来週）
2. スロット粒度を選択（15分/30分/60分）
3. ヒートマップが表示されます

### 3. ヒートマップの見方

- **緑**: 空き時間
- **黄色**: 一部のメンバーに予定あり
- **オレンジ**: 多くのメンバーに予定あり
- **赤**: ほぼ全員に予定あり

### 4. おすすめ時間帯

ヒートマップの下に、最も多くのメンバーが空いている時間帯が表示されます（上位3候補）。

### 5. 予定の作成

1. おすすめ時間帯を確認
2. Googleカレンダーを開く（メンバーのカレンダーが表示されています）
3. Googleカレンダーの標準UIで予定を作成
4. メンバーを招待して会議を設定

## テスト

### 単体テストの範囲

- `FreeBusyService`: スロット丸め、バッチ処理、キャッシュ
- `ManualListProvider`: メンバー解決
- `GoogleGroupProvider`: スタブ実装の検証
- `ChromeStorageRepository`: CRUD操作

### テストケース

```bash
npm test
```

主なテストケース：
- スロット丸め処理の正確性
- 複数メンバーのbusy状態マージ
- アクセスエラーの処理
- キャッシュの動作
- バッチ処理（30人超のケース）

## 制限事項（MVP）

- チームメンバーは手入力のみ（Googleグループ展開は未実装）
- キャッシュはメモリのみ（ページリロードで消える）
- 予定作成機能は未実装
- サーバサイドコンポーネントなし

## 将来の拡張（Phase 2）

- **Googleグループ自動展開**: Admin Directory APIを使用
- **社内API連携**: カスタムTeamProviderで社内ディレクトリと統合
- **サーバサイドキャッシュ**: 大人数チーム対応
- **共有URL**: チームビューの共有機能
- **予定作成**: 候補時間から直接予定を作成

## トラブルシューティング

### 認証エラー

- OAuth設定が正しいか確認
- 拡張機能IDがGoogle Cloud Consoleに登録されているか確認
- `chrome://extensions/`で拡張機能をリロード

### データが表示されない

- メンバーのカレンダーが共有されているか確認
- Google Calendar APIが有効化されているか確認
- ブラウザのコンソールでエラーを確認

### キャッシュのクリア

拡張機能のストレージをクリアするには：
1. `chrome://extensions/`を開く
2. 拡張機能の詳細を表示
3. "ストレージをクリア"をクリック

## ライセンス

MIT License

## 貢献

Pull Requestを歓迎します。大きな変更の場合は、まずissueを作成して変更内容を議論してください。

## サポート

問題が発生した場合は、GitHubのissuesで報告してください。

