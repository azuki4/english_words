// Firestoreのコレクション名
const COLLECTION_NAME = 'words';

// 統計データを管理するクラス
class StatsManager {
    constructor() {
        this.wordsCache = [];
    }

    // 総単語数を取得
    async getTotalWords() {
        try {
            const snapshot = await db.collection(COLLECTION_NAME).get();
            return snapshot.size;
        } catch (error) {
            console.error('Error getting total words:', error);
            return 0;
        }
    }

    // 今日学習した単語数を取得（未実装のため暫定的に0を返す）
    getTodayWords() {
        return 0;
    }

    // 新しい単語を追加
    async addWord(word) {
        try {
            // 既に存在するか確認
            const querySnapshot = await db.collection(COLLECTION_NAME)
                .where('word', '==', word)
                .get();

            // 存在しない場合のみ追加
            if (querySnapshot.empty) {
                await db.collection(COLLECTION_NAME).add({
                    word: word,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error adding word:', error);
            return false;
        }
    }

    // 全ての単語を取得
    async getWords() {
        try {
            const snapshot = await db.collection(COLLECTION_NAME)
                .orderBy('word', 'asc')
                .get();

            const words = [];
            snapshot.forEach(doc => {
                words.push(doc.data().word);
            });

            return words;
        } catch (error) {
            console.error('Error getting words:', error);
            return [];
        }
    }

    // 統計をリセット（設定ページで使用）
    async resetStats() {
        try {
            const snapshot = await db.collection(COLLECTION_NAME).get();
            const batch = db.batch();

            snapshot.forEach(doc => {
                batch.delete(doc.ref);
            });

            await batch.commit();
            return true;
        } catch (error) {
            console.error('Error resetting stats:', error);
            return false;
        }
    }
}

// ページ読み込み時の処理
document.addEventListener('DOMContentLoaded', async function() {
    const statsManager = new StatsManager();
    await updateDisplay(statsManager);
});

// 表示を更新
async function updateDisplay(statsManager) {
    const totalWordsElement = document.getElementById('totalWords');
    const todayWordsElement = document.getElementById('todayWords');

    if (totalWordsElement) {
        const totalWords = await statsManager.getTotalWords();
        totalWordsElement.textContent = totalWords;

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
