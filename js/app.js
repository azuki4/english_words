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

    // 今日学習した単語数を取得（未実装のため暫定的に0を返す）
    getTodayWords() {
        return 0;
    }

    // MyMemory APIを使って翻訳を取得
    async getTranslation(word) {
        try {
            console.log('翻訳を取得中:', word);

            // まずFirestoreから翻訳を検索
            const querySnapshot = await db.collection(COLLECTION_NAME)
                .where('word', '==', word)
                .get();

            if (!querySnapshot.empty) {
                const data = querySnapshot.docs[0].data();
                if (data.translation) {
                    console.log('Firestoreから翻訳を取得:', data.translation);
                    return data.translation;
                }
            }

            // FirestoreになければAPIから取得
            const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(word)}&langpair=en|ja`;
            const response = await fetch(url);
            const data = await response.json();

            if (data.responseStatus === 200 && data.responseData) {
                const translation = data.responseData.translatedText;
                console.log('APIから翻訳を取得:', translation);
                return translation;
            }

            console.log('翻訳を取得できませんでした');
            return '翻訳なし';
        } catch (error) {
            console.error('Error getting translation:', error);
            return '翻訳エラー';
        }
    }

    // 新しい単語を追加
    async addWord(word) {
        try {
            console.log('単語を追加中:', word);

            // 既に存在するか確認
            const querySnapshot = await db.collection(COLLECTION_NAME)
                .where('word', '==', word)
                .get();

            console.log('既存の単語数:', querySnapshot.size);

            // 存在しない場合のみ追加
            if (querySnapshot.empty) {
                // 翻訳を取得
                const translation = await this.getTranslation(word);

                const docRef = await db.collection(COLLECTION_NAME).add({
                    word: word,
                    translation: translation,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });
                console.log('単語を追加しました。ID:', docRef.id);
                return { success: true, translation: translation };
            }
            console.log('単語は既に存在します');
            return { success: false, translation: null };
        } catch (error) {
            console.error('Error adding word:', error);
            alert('エラー: ' + error.message);
            return { success: false, translation: null };
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
                    word: data.word,
                    translation: data.translation || '翻訳なし'
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
