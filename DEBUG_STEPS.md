# デバッグ手順

## コンソールエラーの確認方法

### サイドパネルのコンソール
1. サイドパネルを開く
2. サイドパネル内で右クリック → 「検証」
3. Consoleタブでエラーを確認

### Service Workerのコンソール
1. chrome://extensions/ を開く
2. Team Calendar拡張機能を探す
3. 「Service Worker」の横の「inspect views」をクリック
4. Consoleタブでエラーを確認

## よくあるエラーと対処法

### エラー: "chrome.identity is not defined"
→ manifest.jsonに"identity"権限が含まれているか確認

### エラー: "getAuthToken is not a function"
→ Chrome拡張機能としてインストールされているか確認

### エラー: OAuth関連エラー
→ Client IDが正しく設定されているか確認
→ OAuth同意画面が正しく設定されているか確認

### ボタンがクリックできない
→ JavaScriptエラーがないか確認
→ Reactコンポーネントが正しくレンダリングされているか確認
