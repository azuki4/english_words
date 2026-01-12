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
            console.log('総単語数:', snapshot.size);
            return snapshot.size;
        } catch (error) {
            console.error('Error getting total words:', error);
            alert('エラー: ' + error.message);
            return 0;
        }
    }

    // 今日学習した単語数を取得（Firestoreから共有）
    async getTodayWords() {
        try {
            const today = this.getTodayDateString();
            const docRef = db.collection('dailyStats').doc(today);
            const doc = await docRef.get();

            if (doc.exists) {
                return doc.data().studyCount || 0;
            }
            return 0;
        } catch (error) {
            console.error('Error getting today words:', error);
            return 0;
        }
    }

    // 今日の日付文字列を取得（YYYY-MM-DD形式）
    getTodayDateString() {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    // 今日の学習カウントをインクリメント（Firestoreで共有）
    async incrementTodayStudy() {
        try {
            const today = this.getTodayDateString();
            const docRef = db.collection('dailyStats').doc(today);

            // トランザクションを使用してカウントをインクリメント
            await db.runTransaction(async (transaction) => {
                const doc = await transaction.get(docRef);

                if (doc.exists) {
                    const newCount = (doc.data().studyCount || 0) + 1;
                    transaction.update(docRef, {
                        studyCount: newCount,
                        lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
                    });
                } else {
                    transaction.set(docRef, {
                        studyCount: 1,
                        lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
                    });
                }
            });

            console.log('今日の学習カウントをインクリメントしました');
            return true;
        } catch (error) {
            console.error('Error incrementing today study:', error);
            return false;
        }
    }

    // 新しい単語を追加
    async addWord(word, translations) {
        try {
            console.log('単語を追加中:', word);
            console.log('翻訳:', translations);

            // 既に存在するか確認
            const querySnapshot = await db.collection(COLLECTION_NAME)
                .where('word', '==', word)
                .get();

            console.log('既存の単語数:', querySnapshot.size);

            // 存在しない場合のみ追加
            if (querySnapshot.empty) {
                const docRef = await db.collection(COLLECTION_NAME).add({
                    word: word,
                    translations: translations,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });
                console.log('単語を追加しました。ID:', docRef.id);
                return { success: true };
            }
            console.log('単語は既に存在します');
            return { success: false };
        } catch (error) {
            console.error('Error adding word:', error);
            alert('エラー: ' + error.message);
            return { success: false };
        }
    }

    // 全ての単語を取得
    async getWords() {
        try {
            const snapshot = await db.collection(COLLECTION_NAME).get();

            const words = [];
            snapshot.forEach(doc => {
                const data = doc.data();
                words.push({
                    id: doc.id,  // ドキュメントIDを追加
                    word: data.word,
                    translations: data.translations || []
                });
            });

            // クライアント側でアルファベット順にソート
            words.sort((a, b) => a.word.toLowerCase().localeCompare(b.word.toLowerCase()));

            return words;
        } catch (error) {
            console.error('Error getting words:', error);
            alert('エラー: ' + error.message);
            return [];
        }
    }

    // 単語を更新
    async updateWord(docId, word, translations) {
        try {
            console.log('単語を更新中:', docId, word);
            console.log('翻訳:', translations);

            await db.collection(COLLECTION_NAME).doc(docId).update({
                word: word,
                translations: translations,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            console.log('単語を更新しました');
            return { success: true };
        } catch (error) {
            console.error('Error updating word:', error);
            alert('エラー: ' + error.message);
            return { success: false };
        }
    }

    // 単語を削除
    async deleteWord(docId) {
        try {
            console.log('単語を削除中:', docId);

            await db.collection(COLLECTION_NAME).doc(docId).delete();

            console.log('単語を削除しました');
            return { success: true };
        } catch (error) {
            console.error('Error deleting word:', error);
            alert('エラー: ' + error.message);
            return { success: false };
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
        const todayWords = await statsManager.getTodayWords();
        todayWordsElement.textContent = todayWords;

        // アニメーション効果
        todayWordsElement.style.animation = 'countUp 0.5s ease-out';
    }
}

// グローバルに利用できるようにエクスポート
window.StatsManager = StatsManager;
