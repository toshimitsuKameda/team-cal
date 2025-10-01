# 組織管理者向けクイックスタートガイド

Team Calendar Switcher拡張機能を組織内で配布するための最短手順をまとめています。

---

## 🚀 最速で始める（10分で配布開始）

### ステップ1: ビルド（2分）

```bash
cd team-cal
npm install
npm run build
```

成果物が`dist/`フォルダに生成されます。

### ステップ2: 配布用ZIPの作成（1分）

```bash
cd dist
zip -r ../team-cal-extension.zip .
cd ..
```

### ステップ3: ユーザーへの配布（2分）

1. `team-cal-extension.zip`を共有ドライブにアップロード
2. 以下のインストール手順をユーザーに送信:

```
【Team Calendar拡張機能のインストール】

1. 共有ドライブから team-cal-extension.zip をダウンロード
2. ZIPを解凍（例: C:\Extensions\team-cal-extension\）
3. Chromeで chrome://extensions/ を開く
4. 右上の「デベロッパーモード」をON
5. 「パッケージ化されていない拡張機能を読み込む」をクリック
6. 解凍したフォルダを選択

【初回設定】
1. https://calendar.google.com/ を開く
2. 拡張機能アイコンをクリック
3. Googleアカウントで認証
```

✅ **完了！** ユーザーは今すぐ使い始められます。

---

## 📋 配布方法の選択

### シナリオA: すぐに使いたい（小規模チーム）

**推奨**: 手動配布

- ⏱ セットアップ時間: 10分
- 💰 コスト: 無料
- 👥 適用規模: 〜50人
- ⚠️ 注意: セキュリティ警告が表示される

→ **上記の「最速で始める」を実行**

---

### シナリオB: 長期的に運用したい（中〜大規模組織）

**推奨**: Chrome Web Storeプライベート配布

- ⏱ セットアップ時間: 1-2時間
- 💰 コスト: $5（一回限り）
- 👥 適用規模: 50人〜
- ✅ メリット: 自動更新、警告なし、管理しやすい

→ **[詳細ガイド: DISTRIBUTION_GUIDE.md](DISTRIBUTION_GUIDE.md#方法1-chrome-web-storeプライベート配布)を参照**

---

### シナリオC: Google Workspace Enterprise

**推奨**: 管理コンソール経由で強制配布

- ⏱ セットアップ時間: 2-3時間
- 💰 コスト: $5（Chrome Web Store登録料）
- 👥 適用規模: 制限なし
- ✅ メリット: 自動インストール、ポリシー管理

→ **[詳細ガイド: DISTRIBUTION_GUIDE.md](DISTRIBUTION_GUIDE.md#方法3-google-workspaceポリシー経由)を参照**

---

## 🔧 事前準備チェックリスト

配布前に以下を確認してください:

### 必須項目

- [ ] Node.js 18以上がインストール済み
- [ ] npm install が成功
- [ ] npm run build が成功
- [ ] Google Cloud Projectを作成済み
- [ ] OAuth 2.0 Client IDを取得済み
- [ ] Google Calendar APIを有効化済み
- [ ] manifest.jsonにClient IDを設定済み

### Chrome Web Storeで配布する場合の追加項目

- [ ] Chrome Web Store Developer Dashboard登録（$5）
- [ ] プライバシーポリシーURLを準備
- [ ] スクリーンショットを3-5枚準備
- [ ] サポート連絡先を決定

---

## 📝 よくある質問（FAQ）

### Q1: OAuth設定はどうすればいいですか？

**A**: [SETUP_GUIDE.md](SETUP_GUIDE.md)の「Google Cloud Projectの設定」セクションを参照してください。

簡単な手順:
1. [Google Cloud Console](https://console.cloud.google.com/)でプロジェクト作成
2. OAuth 2.0 Client ID作成（Chrome Extension）
3. Google Calendar API有効化
4. Client IDをmanifest.jsonに設定

### Q2: Chrome Web Storeの審査はどのくらいかかりますか？

**A**: 通常、数時間〜3営業日です。初回は1-2日かかることが多いです。

### Q3: 組織外のユーザーがアクセスできないようにするには？

**A**: Chrome Web Storeのプライベート配布設定で、組織のドメイン（例: `yourcompany.com`）を指定してください。

### Q4: 拡張機能の更新はどうやって配布しますか？

**A**: 
- **手動配布**: 新しいZIPを作成してユーザーに再配布
- **Chrome Web Store**: 新しいバージョンをアップロードすると自動更新（数時間以内）

### Q5: 費用はいくらかかりますか？

**A**: 
- 手動配布: 無料
- Chrome Web Store: $5（一回限りの開発者登録料）
- Google Workspace Enterprise: 既存のEnterpriseライセンスが必要

### Q6: セキュリティは大丈夫ですか？

**A**: はい。
- すべてのデータはブラウザ内で処理
- 外部サーバーへの送信なし
- Google OAuth認証を使用
- 最小限の権限のみ要求

詳細は[PRIVACY_POLICY.md](PRIVACY_POLICY.md)を参照してください。

---

## 🎯 推奨する配布フロー

### Phase 1: パイロット運用（1-2週間）

1. **手動配布**で少数のユーザー（5-10人）に配布
2. フィードバックを収集
3. 問題があれば修正

### Phase 2: 段階的展開（2-4週間）

1. **Chrome Web Storeプライベート配布**に移行
2. 信頼できるテスター（50-100人）に配布
3. 使用状況をモニタリング

### Phase 3: 全社展開

1. 組織全体に公開
2. または、Google Workspace管理コンソールで強制配布
3. サポート体制を整備

---

## 📞 サポート体制の整備

配布後のサポート体制を事前に準備しておくことをお勧めします。

### サポートチャネルの例

- **Slackチャネル**: `#team-calendar-support`
- **メーリングリスト**: `team-calendar-support@yourcompany.com`
- **FAQページ**: イントラネットに設置
- **担当者**: IT部門の担当者を指定

### よくある問い合わせ

ユーザーから以下のような問い合わせが来ることが予想されます:

1. **インストール方法がわからない**
   → インストール手順書を準備（上記参照）

2. **認証エラーが出る**
   → OAuth設定を確認、Google Calendar APIが有効か確認

3. **カレンダーが表示されない**
   → カレンダーの共有設定を確認

4. **データが更新されない**
   → キャッシュをクリア、拡張機能を再読み込み

トラブルシューティングの詳細は[DISTRIBUTION_GUIDE.md](DISTRIBUTION_GUIDE.md#トラブルシューティング)を参照してください。

---

## 📊 成功指標（KPI）

配布後、以下の指標をモニタリングすることをお勧めします:

### 利用状況
- インストール数
- アクティブユーザー数
- チーム作成数

### ユーザー満足度
- フィードバックの収集
- サポート問い合わせ数
- 使用継続率

### ビジネスインパクト
- 会議調整にかかる時間の削減
- 会議のキャンセル率の低下

---

## 🔄 更新の配布

拡張機能を更新する際の手順:

### 手動配布の場合

1. バージョン番号を更新:
```json
// package.json と public/manifest.json
{
  "version": "1.0.1"
}
```

2. ビルド:
```bash
npm run build
```

3. 新しいZIPを作成:
```bash
cd dist
zip -r ../team-cal-extension-v1.0.1.zip .
cd ..
```

4. ユーザーに更新手順を案内:
```
【Team Calendar拡張機能の更新】

1. 最新版をダウンロード: team-cal-extension-v1.0.1.zip
2. 既存のフォルダの内容を削除
3. 新しいZIPを同じ場所に解凍
4. chrome://extensions/ でリロードボタンをクリック
```

### Chrome Web Storeの場合

1. バージョン番号を更新
2. ビルドして新しいZIPを作成
3. Chrome Web Store Developer Dashboardで「パッケージをアップロード」
4. 審査のために送信
5. 承認後、ユーザーのブラウザで自動更新（数時間以内）

---

## 📚 関連ドキュメント

- **配布の詳細**: [DISTRIBUTION_GUIDE.md](DISTRIBUTION_GUIDE.md)
- **セットアップ**: [SETUP_GUIDE.md](SETUP_GUIDE.md)
- **使い方**: [USAGE_GUIDE.md](USAGE_GUIDE.md)
- **プライバシー**: [PRIVACY_POLICY.md](PRIVACY_POLICY.md)
- **Chrome Web Store用**: [WEBSTORE_LISTING.md](WEBSTORE_LISTING.md)

---

## 💡 ヒント

### 配布を成功させるために

1. **事前にテスト**: 本番配布前に少数のユーザーでテスト
2. **ドキュメント準備**: インストール手順とFAQを事前に準備
3. **サポート体制**: 配布初日は問い合わせ対応の準備
4. **フィードバック収集**: 早期にユーザーの声を収集して改善
5. **段階的展開**: いきなり全社展開せず、段階的に拡大

### トラブルを避けるために

1. **OAuth設定の確認**: 配布前に必ず動作確認
2. **権限の説明**: ユーザーに必要な権限を事前に説明
3. **互換性確認**: 対象ブラウザのバージョンを確認
4. **バックアップ**: 古いバージョンのZIPファイルを保管

---

## 🆘 困ったときは

問題が発生した場合は、以下の順序で確認してください:

1. [DISTRIBUTION_GUIDE.md](DISTRIBUTION_GUIDE.md)のトラブルシューティングセクション
2. [README.md](README.md)のトラブルシューティングセクション
3. GitHub Issuesで既存の問題を検索
4. 新しいIssueを作成

---

**準備ができたら、さっそく配布を始めましょう！**

配布に関するご質問があれば、お気軽にお問い合わせください。

