# Google OAuth認証設定ガイド

## 前提条件
- Googleアカウント
- Chrome拡張機能が既に読み込まれていること
- 拡張機能ID（chrome://extensions/で確認可能）

## ステップ1: Google Cloud Consoleでプロジェクト作成

1. [Google Cloud Console](https://console.cloud.google.com/) にアクセス
2. 画面上部の「プロジェクトを選択」をクリック
3. 「新しいプロジェクト」をクリック
4. プロジェクト名: `Team Calendar Extension`（任意）
5. 「作成」をクリック

## ステップ2: APIの有効化

1. 左側のメニューから「APIとサービス」→「ライブラリ」を選択
2. 以下のAPIを検索して有効化：
   - **Google Calendar API** - 「有効にする」をクリック
   - **Google People API** - 「有効にする」をクリック（userinfo.email用）

## ステップ3: 拡張機能IDの確認

1. Chromeで `chrome://extensions/` を開く
2. Team Calendar拡張機能のIDをコピー
   ```
   例: abcdefghijklmnopqrstuvwxyzabcdef
   ```
3. このIDをメモしておく

## ステップ4: OAuth 2.0クライアントIDの作成

1. Google Cloud Consoleで「APIとサービス」→「認証情報」を選択
2. 上部の「認証情報を作成」→「OAuth クライアント ID」をクリック
3. 同意画面の設定（初回のみ）：
   - 「同意画面を構成」をクリック
   - User Type: **外部** を選択（個人使用の場合）
   - 「作成」をクリック
   - アプリ情報:
     - アプリ名: `Team Calendar`
     - ユーザーサポートメール: あなたのメールアドレス
     - デベロッパーの連絡先情報: あなたのメールアドレス
   - 「保存して次へ」をクリック
   - スコープ: そのまま「保存して次へ」
   - テストユーザー: 「保存して次へ」
   - 「ダッシュボードに戻る」

4. OAuth クライアント IDの作成:
   - 「認証情報を作成」→「OAuth クライアント ID」
   - アプリケーションの種類: **Chrome 拡張機能**
   - 名前: `Team Calendar Extension`
   - アイテムID: **ステップ3でコピーした拡張機能ID** を貼り付け
   - 「作成」をクリック

5. クライアントIDをコピー:
   ```
   形式: 123456789012-abc123def456ghi789jkl012mno345pqr.apps.googleusercontent.com
   ```

## ステップ5: manifest.jsonの更新

1. プロジェクトの `public/manifest.json` を開く
2. `client_id` を実際の値に置き換え:
   ```json
   "oauth2": {
     "client_id": "あなたのクライアントID.apps.googleusercontent.com",
     "scopes": [
       "https://www.googleapis.com/auth/calendar.readonly",
       "https://www.googleapis.com/auth/calendar.freebusy",
       "https://www.googleapis.com/auth/userinfo.email"
     ]
   }
   ```

## ステップ6: 拡張機能の再ビルド

```bash
# distディレクトリを削除
rm -rf dist

# 再ビルド
npm run build
```

または開発モードの場合:
```bash
# 開発サーバーを再起動
# Ctrl+C で停止してから
npm run dev
```

## ステップ7: Chromeで拡張機能を再読み込み

1. `chrome://extensions/` を開く
2. Team Calendar拡張機能の「再読み込み」ボタン（🔄）をクリック

## ステップ8: 認証テスト

1. Chromeで任意のページを開く
2. 拡張機能のアイコンをクリックするか、サイドパネルを開く
3. 「Googleでログイン」ボタンをクリック
4. Googleアカウントでログイン
5. 権限の許可画面で「許可」をクリック

## トラブルシューティング

### エラー: "redirect_uri_mismatch"
- Google Cloud Consoleで拡張機能IDが正しく設定されているか確認
- manifest.jsonのclient_idが正しいか確認

### エラー: "Access blocked: This app's request is invalid"
- OAuth同意画面が正しく設定されているか確認
- アプリが「公開」ステータスでなくても、テストユーザーとして自分を追加すればOK

### 認証画面が表示されない
- chrome.identity APIの権限がmanifest.jsonに含まれているか確認
- 拡張機能を完全に削除して再読み込み

### APIエラー
- Calendar APIが有効化されているか確認
- APIキーの制限設定を確認（通常は不要）

## 次のステップ

認証が成功したら：
1. チームビューを作成
2. メンバーのメールアドレスを追加
3. カレンダーの空き状況を確認

詳細は `README.md` を参照してください。

