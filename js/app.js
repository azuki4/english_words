// ローカルストレージのキー
const STORAGE_KEYS = {
    LEARNED_WORDS: 'learnedWords',
    TODAY_DATE: 'todayDate',
    TODAY_COUNT: 'todayCount'
};

// 統計データを管理するクラス
class StatsManager {
    constructor() {
        this.init();
    }

    init() {
        // 学習済み単語のセット（重複を防ぐ）
        if (!localStorage.getItem(STORAGE_KEYS.LEARNED_WORDS)) {
            localStorage.setItem(STORAGE_KEYS.LEARNED_WORDS, JSON.stringify([]));
        }

        // 日付が変わっていたら今日のカウントをリセット
        this.checkAndResetDailyCount();
    }

    checkAndResetDailyCount() {
        const today = new Date().toDateString();
        const savedDate = localStorage.getItem(STORAGE_KEYS.TODAY_DATE);

        if (savedDate !== today) {
            localStorage.setItem(STORAGE_KEYS.TODAY_DATE, today);
            localStorage.setItem(STORAGE_KEYS.TODAY_COUNT, '0');
        }
    }

    // 総単語数を取得
    getTotalWords() {
        const words = JSON.parse(localStorage.getItem(STORAGE_KEYS.LEARNED_WORDS) || '[]');
        return words.length;
    }

    // 今日学習した単語数を取得（未実装のため暫定的に0を返す）
    getTodayWords() {
        return 0;
    }

    // 新しい単語を追加
    addWord(word) {
        const words = JSON.parse(localStorage.getItem(STORAGE_KEYS.LEARNED_WORDS) || '[]');

        // 既に学習済みでない場合のみ追加
        if (!words.includes(word)) {
            words.push(word);
            localStorage.setItem(STORAGE_KEYS.LEARNED_WORDS, JSON.stringify(words));
        }
    }

    // 全ての単語を取得
    getWords() {
        return JSON.parse(localStorage.getItem(STORAGE_KEYS.LEARNED_WORDS) || '[]');
    }

    // 統計をリセット（設定ページで使用）
    resetStats() {
        localStorage.setItem(STORAGE_KEYS.LEARNED_WORDS, JSON.stringify([]));
        localStorage.setItem(STORAGE_KEYS.TODAY_COUNT, '0');
    }
}

// ページ読み込み時の処理
document.addEventListener('DOMContentLoaded', function() {
    const statsManager = new StatsManager();
    updateDisplay(statsManager);
});

// 表示を更新
function updateDisplay(statsManager) {
    const totalWordsElement = document.getElementById('totalWords');
    const todayWordsElement = document.getElementById('todayWords');

    if (totalWordsElement) {
        totalWordsElement.textContent = statsManager.getTotalWords();

        // アニメーション効果
        totalWordsElement.style.animation = 'countUp 0.5s ease-out';
    }

    if (todayWordsElement) {
        todayWordsElement.textContent = statsManager.getTodayWords();

        // アニメーション効果
        todayWordsElement.style.animation = 'countUp 0.5s ease-out';
    }
}

// グローバルに利用できるようにエクスポート
window.StatsManager = StatsManager;
