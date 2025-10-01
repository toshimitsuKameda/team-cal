import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

console.log('📝 ビルド後処理を実行中...');

try {
  // dist/src/panel/index.html を読み込む
  const htmlPath = join('dist', 'src', 'panel', 'index.html');
  
  // ファイルの存在確認
  if (!existsSync(htmlPath)) {
    throw new Error(`HTMLファイルが見つかりません: ${htmlPath}`);
  }
  
  let html = readFileSync(htmlPath, 'utf-8');
  console.log(`📄 ${htmlPath} を読み込みました`);
  
  // 絶対パスを相対パスに変換
  const beforeHtml = html;
  html = html.replace(/src="\/([^"]+)"/g, 'src="./$1"');
  html = html.replace(/href="\/([^"]+)"/g, 'href="./$1"');
  
  if (beforeHtml === html) {
    console.warn('⚠️  パスの置換が行われませんでした');
  } else {
    console.log('✅ パスを相対パスに変換しました');
  }
  
  // dist/panel.html に書き出す
  const outputPath = join('dist', 'panel.html');
  writeFileSync(outputPath, html);
  console.log(`💾 ${outputPath} に保存しました`);
  
  // 生成確認
  if (!existsSync(outputPath)) {
    throw new Error('panel.htmlの生成に失敗しました');
  }
  
  const fileSize = readFileSync(outputPath, 'utf-8').length;
  console.log(`✅ panel.html を作成しました (${fileSize} bytes)`);
  
} catch (error) {
  console.error('❌ ビルド後処理でエラーが発生:', error);
  console.error('エラー詳細:', error.message);
  process.exit(1);
}

