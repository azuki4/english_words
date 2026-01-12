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

    // jisho.org APIを使って翻訳を取得
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

            // Firestoreになければjisho.org APIから取得（Cloudflare Workers経由）
            const proxyUrl = `https://english-words.azukibaka090.workers.dev/?keyword=${encodeURIComponent(word)}`;
            console.log('APIリクエストURL（Cloudflare Workers経由）:', proxyUrl);

            const response = await fetch(proxyUrl);
            console.log('レスポンスステータス:', response.status);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('APIレスポンス:', data);

            // デバッグ情報を表示
            if (data._debug) {
                console.log('=== デバッグ情報 ===');
                console.log('単語:', data._debug.keyword);
                console.log('タイムスタンプ:', data._debug.timestamp);
                console.log('試行回数:', data._debug.attempts.length);
                data._debug.attempts.forEach((attempt, index) => {
                    console.log(`試行${index + 1}:`, attempt);
                });
                console.log('===================');
            }

            // エラーレスポンスの場合
            if (data.error) {
                console.error('APIエラー:', data.error);
                console.error('詳細:', data.details);
                if (data.debug) {
                    console.error('=== エラーデバッグ情報 ===');
                    console.error('単語:', data.debug.keyword);
                    console.error('試行回数:', data.debug.attempts.length);
                    data.debug.attempts.forEach((attempt, index) => {
                        console.error(`試行${index + 1}:`, attempt);
                    });
                    console.error('=======================');
                }
                throw new Error(data.error);
            }

            if (data.data && data.data.length > 0) {
                // 最初のエントリのみから日本語訳を取得
                const entry = data.data[0];

                if (entry.japanese && entry.japanese.length > 0) {
                    // 最初の日本語表記を取得（wordまたはreading）
                    const firstJapanese = entry.japanese[0];
                    const translation = firstJapanese.word || firstJapanese.reading || '翻訳なし';

                    console.log('取得した翻訳:', translation);
                    console.log('jisho.org APIから翻訳を取得:', translation);
                    return translation;
                }
            }

            console.log('翻訳を取得できませんでした');
            return '翻訳なし';
        } catch (error) {
            console.error('翻訳取得エラーの詳細:', error);
            console.error('エラーメッセージ:', error.message);
            console.error('エラースタック:', error.stack);
            return '翻訳エラー: ' + error.message;
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
