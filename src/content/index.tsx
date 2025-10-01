import React from 'react';
import { createRoot } from 'react-dom/client';
import { TeamSelectorWidget } from './TeamSelectorWidget';

console.log('🚀 TeamCal Content Script が起動しました');

// UIをマウントする関数
function mountWidget() {
  // 既存のウィジェットがあれば削除
  const existingWidget = document.getElementById('teamcal-widget-root');
  if (existingWidget) {
    existingWidget.remove();
  }

  // ウィジェット用のコンテナを作成
  const container = document.createElement('div');
  container.id = 'teamcal-widget-root';
  document.body.appendChild(container);

  // Reactをマウント
  const root = createRoot(container);
  root.render(
    <React.StrictMode>
      <TeamSelectorWidget />
    </React.StrictMode>
  );

  console.log('✅ TeamCalウィジェットをマウントしました');
}

// ページ読み込み後にウィジェットをマウント
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mountWidget);
} else {
  // 既に読み込まれている場合は即座にマウント
  mountWidget();
}

// ゲスト操作関数をグローバルに公開
(window as any).toggleCalendarCheckboxes = toggleCalendarCheckboxes;

/**
 * ゲスト機能を使ってカレンダーを切り替え
 */
async function toggleCalendarCheckboxes(emailsToShow: string[], emailsToHide: string[]) {
  console.log('👥 ゲスト機能でカレンダーを切り替えます');

  try {
    // 1. 全てのゲストをクリア
    console.log('🗑️  全てのゲストをクリア中...');
    await clearAllGuests();

    // 2. 新しいゲストを追加（カンマ区切りで一度に）
    if (emailsToShow.length > 0) {
      console.log('➕ 新しいゲストを追加中...');
      await addGuestsInBatch(emailsToShow);
    }

    console.log('✅ カレンダーの切り替えが完了しました');
  } catch (error) {
    console.error('❌ ゲスト機能での切り替えに失敗:', error);
    console.log('⚠️  フォールバック: マイカレンダーのチェックボックスで切り替えます');
    // フォールバック: 従来のチェックボックス方式
    toggleCalendarCheckboxesFallback(emailsToShow, emailsToHide);
  }
}

/**
 * ゲストを一括追加（カンマ区切り）
 */
async function addGuestsInBatch(emails: string[]): Promise<void> {
  const searchBox = findGuestSearchBox();
  
  if (!searchBox) {
    throw new Error('ゲスト検索ボックスが見つかりません');
  }

  console.log(`👥 ${emails.length}人のゲストを一括追加します`);
  
  try {
    // カンマ区切りで全てのメールアドレスを結合
    const emailsText = emails.join(', ');
    console.log(`📝 入力するテキスト: ${emailsText}`);
    
    // 検索ボックスに入力
    (searchBox as HTMLInputElement).value = emailsText;
    searchBox.dispatchEvent(new Event('input', { bubbles: true }));
    searchBox.dispatchEvent(new Event('change', { bubbles: true }));
    
    // 少し待つ（検索結果の表示待ち）
    await wait(800);
    
    // Enterキーを押す
    const enterEvent = new KeyboardEvent('keydown', {
      key: 'Enter',
      code: 'Enter',
      keyCode: 13,
      which: 13,
      bubbles: true,
      cancelable: true,
    });
    searchBox.dispatchEvent(enterEvent);
    
    // 追加処理の完了待ち
    await wait(500);
    
    // 検索ボックスをクリア
    (searchBox as HTMLInputElement).value = '';
    
    console.log(`✅ ${emails.length}人のゲストを追加しました`);
  } catch (error) {
    console.error(`❌ ゲストの一括追加に失敗:`, error);
    throw error;
  }
}

/**
 * 全てのゲストをクリア（一括削除ボタンを使用）
 */
async function clearAllGuests(): Promise<void> {
  try {
    // ゲストが存在するか確認
    const guestItems = findGuestItems();
    
    if (guestItems.length === 0) {
      console.log('ℹ️  クリアするゲストはありません');
      return;
    }
    
    console.log(`🗑️  ${guestItems.length}人のゲストを一括削除中...`);
    
    // 「検索をクリア」ボタンを探す（一括削除）
    const clearButton = document.querySelector('[jsname="uXqWSe"], [aria-label*="検索をクリア"], [aria-label*="Clear search"]');
    
    if (!clearButton) {
      console.error('❌ 一括削除ボタンが見つかりません');
      throw new Error('一括削除ボタンが見つかりません');
    }
    
    console.log('✅ 一括削除ボタンを発見:', clearButton);
    (clearButton as HTMLElement).click();
    
    // クリック後の処理を待つ
    await wait(500);
    
    // 確認
    const remainingGuests = findGuestItems();
    if (remainingGuests.length === 0) {
      console.log('✅ 全てのゲストをクリアしました（一括削除）');
    } else {
      console.warn(`⚠️  ${remainingGuests.length}人のゲストが残っています`);
      // 再試行
      if (remainingGuests.length > 0) {
        console.log('🔄 再試行: 一括削除ボタンを再度クリック');
        const retryButton = document.querySelector('[jsname="uXqWSe"]');
        if (retryButton) {
          (retryButton as HTMLElement).click();
          await wait(500);
          console.log('✅ 再試行完了');
        }
      }
    }
  } catch (error) {
    console.error(`❌ ゲストのクリアに失敗:`, error);
    throw error;
  }
}

/**
 * ゲスト検索ボックスを見つける
 */
function findGuestSearchBox(): Element | null {
  // jsname属性で検索（最も確実）
  let searchBox = document.querySelector('[jsname="YPqjbf"]');
  if (searchBox) {
    console.log('✅ ゲスト検索ボックスを発見（jsname）');
    return searchBox;
  }
  
  // aria-labelで検索
  searchBox = document.querySelector('[aria-label*="ユーザーを検索"], [aria-label*="Search for people"], [aria-label*="予定に招待"]');
  if (searchBox) {
    console.log('✅ ゲスト検索ボックスを発見（aria-label）');
    return searchBox;
  }
  
  console.error('❌ ゲスト検索ボックスが見つかりません');
  return null;
}

/**
 * ゲストアイテムのリストを取得
 */
function findGuestItems(): Element[] {
  // 「選択中のユーザー」セクションを探す
  const guestSection = document.querySelector('[aria-label*="選択中のユーザー"], [role="listbox"][aria-label*="選択"]');
  
  if (!guestSection) {
    return [];
  }
  
  // div[jsname="adtrT"] を使ってゲストアイテムを取得
  const items = Array.from(guestSection.querySelectorAll('[jsname="adtrT"]'));
  return items;
}

/**
 * 待機関数
 */
function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * フォールバック: 従来のチェックボックス方式
 */
function toggleCalendarCheckboxesFallback(emailsToShow: string[], emailsToHide: string[]) {
  console.log('🔍 マイカレンダーのチェックボックスで切り替え...');

  // 表示するカレンダー
  for (const email of emailsToShow) {
    const checkbox = findCalendarCheckbox(email);
    if (checkbox && !(checkbox as HTMLInputElement).checked) {
      (checkbox as HTMLElement).click();
      console.log(`✅ チェックボックスをオン: ${email}`);
    }
  }

  // 非表示にするカレンダー
  for (const email of emailsToHide) {
    const checkbox = findCalendarCheckbox(email);
    if (checkbox && (checkbox as HTMLInputElement).checked) {
      (checkbox as HTMLElement).click();
      console.log(`☐ チェックボックスをオフ: ${email}`);
    }
  }
}

/**
 * カレンダーのチェックボックスを探す
 */
function findCalendarCheckbox(email: string): Element | null {
  // マイカレンダーセクションを探す
  const myCalendars = document.querySelector('[aria-label*="マイカレンダー"], [aria-label*="My calendars"]');
  
  if (!myCalendars) {
    console.warn('⚠️  マイカレンダーセクションが見つかりません');
    return null;
  }
  
  // メールアドレスを含むラベルを探す
  const labels = Array.from(myCalendars.querySelectorAll('label, [role="listitem"]'));
  
  for (const label of labels) {
    const text = label.textContent || '';
    if (text.includes(email)) {
      // チェックボックスを探す
      const checkbox = label.querySelector('input[type="checkbox"]');
      if (checkbox) {
        return checkbox;
      }
    }
  }
  
  return null;
}

// MutationObserverでカレンダーの変更を監視（デバッグ用）
const observer = new MutationObserver((mutations) => {
  for (const mutation of mutations) {
    if (mutation.addedNodes.length > 0) {
      const addedNode = mutation.addedNodes[0];
      if (addedNode.nodeType === Node.ELEMENT_NODE) {
        const element = addedNode as Element;
        // 重要な変更のみログ
        if (element.matches && (
          element.matches('[aria-label*="マイカレンダー"]') ||
          element.matches('[jsname="adtrT"]') ||
          element.matches('.DB71Ge')
        )) {
          console.log('📊 カレンダーリストが追加されました');
        }
      }
    }
  }
});

// カレンダーの左サイドバーを監視
const observeCalendarList = () => {
  const calendarList = document.querySelector('[role="navigation"], .lSl5Nc');
  if (calendarList) {
    observer.observe(calendarList, {
      childList: true,
      subtree: true,
    });
    console.log('👀 カレンダーリストの監視を開始しました');
  } else {
    // まだカレンダーリストが読み込まれていない場合は、少し待ってリトライ
    setTimeout(observeCalendarList, 1000);
  }
};

observeCalendarList();

