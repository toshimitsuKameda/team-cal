import { existsSync, statSync } from 'fs';
import { join } from 'path';

console.log('\n🔍 ビルド結果を検証中...');

const requiredFiles = [
  'dist/panel.html',
  'dist/panel.js',
  'dist/panel.css',
  'dist/background.js',
  'dist/manifest.json',
];

const optionalFiles = [
  'dist/icon16.png',
  'dist/icon48.png',
  'dist/icon128.png',
];

let hasError = false;

// 必須ファイルの確認
console.log('\n📋 必須ファイル:');
for (const file of requiredFiles) {
  if (existsSync(file)) {
    const stats = statSync(file);
    const sizeKB = (stats.size / 1024).toFixed(2);
    console.log(`  ✅ ${file} (${sizeKB} KB)`);
  } else {
    console.error(`  ❌ ${file} が見つかりません`);
    hasError = true;
  }
}

// オプションファイルの確認
console.log('\n🎨 オプションファイル:');
for (const file of optionalFiles) {
  if (existsSync(file)) {
    const stats = statSync(file);
    const sizeKB = (stats.size / 1024).toFixed(2);
    console.log(`  ✅ ${file} (${sizeKB} KB)`);
  } else {
    console.warn(`  ⚠️  ${file} が見つかりません（オプション）`);
  }
}

// panel.htmlの内容を確認
if (existsSync('dist/panel.html')) {
  const { readFileSync } = await import('fs');
  const html = readFileSync('dist/panel.html', 'utf-8');
  
  console.log('\n📄 panel.html の検証:');
  
  // 相対パスチェック
  if (html.includes('src="./panel.js"')) {
    console.log('  ✅ panel.js が相対パスで参照されています');
  } else if (html.includes('src="/panel.js"')) {
    console.error('  ❌ panel.js が絶対パスで参照されています（相対パスに修正が必要）');
    hasError = true;
  } else {
    console.error('  ❌ panel.js の参照が見つかりません');
    hasError = true;
  }
  
  if (html.includes('href="./panel.css"')) {
    console.log('  ✅ panel.css が相対パスで参照されています');
  } else if (html.includes('href="/panel.css"')) {
    console.error('  ❌ panel.css が絶対パスで参照されています（相対パスに修正が必要）');
    hasError = true;
  } else {
    console.error('  ❌ panel.css の参照が見つかりません');
    hasError = true;
  }
  
  // ルート要素の確認
  if (html.includes('<div id="root"></div>')) {
    console.log('  ✅ root要素が存在します');
  } else {
    console.error('  ❌ root要素が見つかりません');
    hasError = true;
  }
}

console.log('\n' + '='.repeat(50));

if (hasError) {
  console.error('❌ ビルドの検証に失敗しました');
  console.error('\n修正方法:');
  console.error('1. npm run build を再実行');
  console.error('2. dist/ フォルダを削除してから再ビルド: rm -rf dist && npm run build');
  process.exit(1);
} else {
  console.log('✅ すべてのファイルが正しく生成されました！');
  console.log('\n次の手順:');
  console.log('1. chrome://extensions/ を開く');
  console.log('2. 拡張機能を更新またはリロード');
  console.log('3. サイドパネルを開いて動作確認');
}

