# アーキテクチャ設計

## 概要

このドキュメントは、Team Calendar拡張機能のアーキテクチャ設計と、将来の拡張（Phase 2以降）への移行パスを説明します。

## 設計原則

### 1. 関心の分離（Separation of Concerns）

各レイヤーは明確に分離され、依存関係は一方向です：

```
UI Layer (React Components)
    ↓
Service Layer (Business Logic)
    ↓
Data Layer (Storage & API)
```

### 2. 依存性注入（Dependency Injection）

主要なサービスは抽象インターフェースに依存し、具体的な実装は注入されます：

```typescript
interface TeamProvider {
  resolveMembers(view: TeamView): Promise<TeamMember[]>;
}

// MVP: 手入力
class ManualListProvider implements TeamProvider { ... }

// Phase 2: Googleグループ
class GoogleGroupProvider implements TeamProvider { ... }

// Phase 3: 社内API
class RemoteDirectoryProvider implements TeamProvider { ... }
```

### 3. 段階的な機能拡張

Feature Flagsを使用して、新機能を段階的に有効化：

```typescript
const useFeatureFlags = () => ({
  enableGoogleGroups: false,     // Phase 2
  enableRemoteDirectory: false,  // Phase 3
  enableEventCreation: false,    // Phase 2
  enableSharing: false,          // Phase 3
});
```

## コアコンポーネント

### TeamProvider（チームメンバー解決）

**責務**: TeamViewからメンバー配列への解決

**MVP実装**: `ManualListProvider`
- TeamView.membersをそのまま返す
- 検索機能なし

**Phase 2実装**: `GoogleGroupProvider`
- Admin Directory APIを使用
- グループIDからメンバーを展開
- キャッシュ管理

**Phase 3実装**: `RemoteDirectoryProvider`
- 社内API（REST/GraphQL）を呼び出し
- 認証トークンの管理
- エラーハンドリング

### FreeBusyService（空き状況取得）

**責務**: メンバー配列から空き状況スロットへの変換

**MVP実装**:
```typescript
class FreeBusyService {
  async query(members, window): Promise<{slots, accessInfo}> {
    // 1. メンバーをバッチ化（最大30人/リクエスト）
    // 2. Google Calendar API呼び出し
    // 3. busyブロックをスロットに丸める
    // 4. メモリキャッシュ（TTL: 60秒）
  }
}
```

**Phase 2拡張**:
- サーバサイドプロキシ
- Redis/Memcachedキャッシュ
- バッチ最適化（並列処理）

**アルゴリズム**:

1. **バッチ化**:
```typescript
const MAX_PARTICIPANTS = 30;
const batches = chunk(members, MAX_PARTICIPANTS);
```

2. **API呼び出し**:
```typescript
POST https://www.googleapis.com/calendar/v3/freeBusy
{
  "timeMin": "2025-10-01T00:00:00Z",
  "timeMax": "2025-10-01T23:59:59Z",
  "items": [{ "id": "user1@example.com" }, ...]
}
```

3. **スロット丸め**:
```typescript
// 例: 30分スロット
// 9:15-9:45のbusyブロック → 9:00-9:30と9:30-10:00の両方をbusyにマーク
```

### StorageRepository（データ永続化）

**責務**: TeamViewとUserPrefsの保存・取得

**MVP実装**: `ChromeStorageRepository`
- `chrome.storage.sync`を使用
- 単純なCRUD操作
- ユーザーごとに独立

**Phase 3実装**: `FirestoreRepository`
- Cloud Firestoreを使用
- 共有URL/ACL対応
- リアルタイム同期

**データモデル**:
```typescript
// chrome.storage.sync
{
  "teamViews": [
    {
      "id": "uuid",
      "name": "営業本部",
      "source": "manual",
      "members": [...],
      "owner": "user@example.com",
      "createdAt": "2025-10-01T00:00:00Z",
      "updatedAt": "2025-10-01T00:00:00Z"
    }
  ],
  "userPrefs": {
    "defaultViewId": "uuid",
    "slotMinutes": 30,
    "showTentativeAsBusy": true
  }
}
```

## UIコンポーネント階層

```
App
├── AuthRequired (if not authenticated)
└── MainPanel
    ├── TeamViewSelect
    │   └── TeamViewEditor (modal)
    ├── TimeRangePicker
    ├── AccessInfo
    ├── Heatmap
    │   └── HeatmapSlot[]
    └── TopCandidates
        └── CandidateCard[]
```

### 状態管理

MVPでは単純なReact Hooksを使用：

```typescript
const [teamViews, setTeamViews] = useState<TeamView[]>([]);
const [selectedView, setSelectedView] = useState<TeamView | null>(null);
const [freeBusySlots, setFreeBusySlots] = useState<FreeBusySlot[]>([]);
```

**Phase 2以降**: Redux ToolkitまたはZustandを導入

## エラーハンドリング

### 階層別エラー処理

1. **API層**: 
   - HTTP エラー → 再試行（3回、exponential backoff）
   - 認証エラー → トークンリフレッシュ
   - レート制限 → 429エラーをキャッチしてキュー

2. **Service層**:
   - バッチ単位でのエラー隔離
   - 部分的な成功を許容（一部メンバーの失敗を除外）

3. **UI層**:
   - ユーザーフレンドリーなエラーメッセージ
   - 再試行ボタンの提供
   - オフライン検知

### エラーの種類と対応

| エラー | 原因 | 対応 |
|--------|------|------|
| 403 Forbidden | カレンダー共有権限なし | メンバーを除外、UIに表示 |
| 404 Not Found | メールアドレス不正 | メンバーを除外、UIに警告 |
| 429 Too Many Requests | レート制限 | 指数バックオフで再試行 |
| 401 Unauthorized | トークン期限切れ | トークンリフレッシュ |
| Network Error | オフライン | キャッシュを使用、オフライン通知 |

## パフォーマンス最適化

### キャッシュ戦略

**MVP**:
- メモリキャッシュ（TTL: 60秒）
- キャッシュキー: `${memberEmails}|${startISO}|${endISO}|${slotMinutes}`

**Phase 2**:
- chrome.storage.session（セッションキャッシュ、TTL: 5分）
- Service Workerでのバックグラウンドプリフェッチ

**Phase 3**:
- Redisサーバサイドキャッシュ（TTL: 10分）
- WebSocketでのリアルタイム無効化

### バッチ最適化

現在の制限: 30人/リクエスト

**Phase 2改善**:
```typescript
// 並列バッチ処理
const batches = chunk(members, 30);
const results = await Promise.all(
  batches.map(batch => freeBusyService.queryBatch(batch))
);
```

### レンダリング最適化

- `React.memo`でコンポーネントのメモ化
- 仮想スクロール（大量スロット表示時）
- デバウンス（検索、入力フィールド）

## セキュリティ

### OAuth認証

- Chrome Identity APIを使用
- 最小権限の原則（readonly + freebusy のみ）
- トークンは拡張機能内で管理（外部送信なし）

### データ保護

- カレンダーの詳細情報は取得しない（free/busyのみ）
- chrome.storage.sync は自動的に暗号化
- XSS対策（React自動エスケープ）

## テスト戦略

### 単体テスト（vitest）

- サービス層のロジック
- スロット丸め処理
- バッチ処理
- キャッシュ動作

### 統合テスト（Phase 2）

- E2Eテスト（Playwright）
- API モッキング（MSW）
- 複数ユーザーシナリオ

### 負荷テスト（Phase 2）

- 50人×週表示で<2.5秒
- キャッシュ後<1秒
- メモリ使用量<100MB

## 移行パス

### MVP → Phase 2

1. GoogleGroupProvider実装
2. Admin Directory APIの認証追加
3. グループ検索UIの追加
4. サーバサイドプロキシ（オプション）

必要な変更:
```typescript
// manifest.json
"oauth2": {
  "scopes": [
    ...existing,
    "https://www.googleapis.com/auth/admin.directory.group.readonly"
  ]
}

// UI
<TeamViewEditor source="google-group" />
```

### Phase 2 → Phase 3

1. RemoteDirectoryProvider実装
2. カスタム認証フローの追加
3. Firestoreへの移行
4. 共有URL機能の実装

必要な変更:
- バックエンドAPI（Node.js/Firestore）
- 共有リンク生成UI
- ACL管理画面

## まとめ

この設計により、MVPを迅速に実装しながら、将来の拡張に柔軟に対応できます。各レイヤーの抽象化により、実装の差し替えが容易で、段階的な機能追加が可能です。

