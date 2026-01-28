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

    // 今日の日付文字列を取得（YYYY-MM-DD形式、日本時間）
    getTodayDateString() {
        // 日本時間（JST, UTC+9）で日付を取得
        const jstDate = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Tokyo' }));
        const year = jstDate.getFullYear();
        const month = String(jstDate.getMonth() + 1).padStart(2, '0');
        const day = String(jstDate.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    // 今日の学習カウントをインクリメント（Firestoreで共有）
    // データ構造: dailyStats/{YYYY-MM-DD} = { studyCount, lastUpdated }
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
                    // 新しい日付の場合、カウントは1から始まる
                    transaction.set(docRef, {
                        studyCount: 1,
                        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
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

    // 過去の学習データを取得（将来の実装用）
    async getStudyHistory(startDate, endDate) {
        try {
            let query = db.collection('dailyStats');

            if (startDate) {
                query = query.where(firebase.firestore.FieldPath.documentId(), '>=', startDate);
            }
            if (endDate) {
                query = query.where(firebase.firestore.FieldPath.documentId(), '<=', endDate);
            }

            const snapshot = await query.orderBy(firebase.firestore.FieldPath.documentId(), 'desc').get();

            const history = [];
            snapshot.forEach(doc => {
                history.push({
                    date: doc.id,
                    studyCount: doc.data().studyCount || 0,
                    lastUpdated: doc.data().lastUpdated
                });
            });

            return history;
        } catch (error) {
            console.error('Error getting study history:', error);
            return [];
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
                    memoryScore: 50.0,  // 初期記憶度
                    lastStudiedDate: null,  // 最後に学習した日付（初期はnull）
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

            // createdAtがない場合のデフォルト日付（2026/1/28）
            const defaultCreatedAt = new Date('2026-01-28T00:00:00+09:00');

            const words = [];
            snapshot.forEach(doc => {
                const data = doc.data();

                // createdAtの処理: FirestoreのタイムスタンプをDateに変換
                let createdAt;
                if (data.createdAt && data.createdAt.toDate) {
                    createdAt = data.createdAt.toDate();
                } else {
                    createdAt = defaultCreatedAt;
                }

                words.push({
                    id: doc.id,  // ドキュメントIDを追加
                    word: data.word,
                    translations: data.translations || [],
                    memoryScore: data.memoryScore !== undefined ? data.memoryScore : 50.0,
                    lastStudiedDate: data.lastStudiedDate || null,
                    createdAt: createdAt
                });
            });

            // クライアント側でアルファベット順にソート（デフォルト）
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

    // 単語の記憶度を更新（4段階評価ボタン押下時）
    // rating: 1=全くわからない, 2=少しわかる, 3=だいたいわかる, 4=完璧にわかる
    async updateMemoryScore(docId, rating) {
        try {
            const today = this.getTodayDateString();
            const docRef = db.collection(COLLECTION_NAME).doc(docId);

            await db.runTransaction(async (transaction) => {
                const doc = await transaction.get(docRef);

                if (!doc.exists) {
                    throw new Error('単語が存在しません');
                }

                const data = doc.data();
                const currentScore = data.memoryScore !== undefined ? data.memoryScore : 50.0;
                const lastStudiedDate = data.lastStudiedDate;

                let scoreChange = 0;

                // 最後に学習した日付が今日と異なる場合、または初回学習の場合
                if (lastStudiedDate !== today) {
                    // 通常の変動
                    if (rating === 1) scoreChange = -25;
                    else if (rating === 2) scoreChange = -12.5;
                    else if (rating === 3) scoreChange = 12.5;
                    else if (rating === 4) scoreChange = 25;
                } else {
                    // 最後に学習した日付が今日と同じ場合
                    if (currentScore < 50) {
                        // 記憶度50未満の場合は通常の変動
                        if (rating === 1) scoreChange = -25;
                        else if (rating === 2) scoreChange = -12.5;
                        else if (rating === 3) scoreChange = 12.5;
                        else if (rating === 4) scoreChange = 25;
                    } else {
                        // 記憶度50以上の場合は増加が小さい
                        if (rating === 1) scoreChange = -25;
                        else if (rating === 2) scoreChange = -12.5;
                        else if (rating === 3) scoreChange = 1.25;
                        else if (rating === 4) scoreChange = 2.5;
                    }
                }

                // 新しい記憶度を計算（0~100の範囲に制限）
                let newScore = currentScore + scoreChange;
                newScore = Math.max(0, Math.min(100, newScore));

                // 更新
                transaction.update(docRef, {
                    memoryScore: newScore,
                    lastStudiedDate: today,
                    lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
                });

                console.log(`記憶度更新: ${currentScore} -> ${newScore} (変動: ${scoreChange})`);
            });

            return { success: true };
        } catch (error) {
            console.error('Error updating memory score:', error);
            return { success: false };
        }
    }

    // 日次の記憶度減衰処理（日付変更時に1回のみ実行）
    async applyDailyMemoryDecay() {
        try {
            const today = this.getTodayDateString();

            // 日次処理が実行されたかチェック
            const dailyProcessRef = db.collection('systemConfig').doc('dailyProcess');

            // トランザクションで排他制御
            const needsProcessing = await db.runTransaction(async (transaction) => {
                const doc = await transaction.get(dailyProcessRef);

                if (doc.exists && doc.data().lastProcessedDate === today) {
                    // 今日すでに処理済み
                    return false;
                }

                // 処理済みとしてマーク
                transaction.set(dailyProcessRef, {
                    lastProcessedDate: today,
                    processedAt: firebase.firestore.FieldValue.serverTimestamp()
                }, { merge: true });

                return true;
            });

            if (!needsProcessing) {
                console.log('日次処理は既に実行済みです');
                return { success: true, processed: false };
            }

            // 全単語を取得
            const snapshot = await db.collection(COLLECTION_NAME).get();
            const batch = db.batch();
            let processedCount = 0;

            snapshot.forEach(doc => {
                const data = doc.data();
                const currentScore = data.memoryScore !== undefined ? data.memoryScore : 50.0;
                let lastStudiedDate = data.lastStudiedDate;

                // lastStudiedDateがnullの場合は登録日（createdAt）を参照
                if (!lastStudiedDate && data.createdAt) {
                    const createdAtDate = data.createdAt.toDate();
                    const jstCreatedDate = new Date(createdAtDate.toLocaleString('en-US', { timeZone: 'Asia/Tokyo' }));
                    const year = jstCreatedDate.getFullYear();
                    const month = String(jstCreatedDate.getMonth() + 1).padStart(2, '0');
                    const day = String(jstCreatedDate.getDate()).padStart(2, '0');
                    lastStudiedDate = `${year}-${month}-${day}`;
                }

                // 基準日付が存在し、今日と異なる場合のみ減衰処理
                if (lastStudiedDate && lastStudiedDate !== today) {
                    const daysDiff = this.getDaysDifference(lastStudiedDate, today);
                    let newScore = currentScore;

                    // 経過日数分の減衰を日ごとにシミュレート
                    // n: 最後に学習した日からの経過日数（1から開始）
                    for (let n = 1; n <= daysDiff; n++) {
                        if (newScore >= 80) {
                            // 記憶度が80以上の場合: -1
                            newScore = newScore - 1;
                        } else {
                            // 記憶度が80未満の場合: ×(n+4)/(n+5)
                            newScore = newScore * (n + 4) / (n + 5);
                        }
                    }

                    // 0~100の範囲に制限
                    newScore = Math.max(0, Math.min(100, newScore));

                    batch.update(doc.ref, { memoryScore: newScore });
                    processedCount++;
                }
            });

            if (processedCount > 0) {
                await batch.commit();
                console.log(`日次減衰処理完了: ${processedCount}件の単語を処理`);
            }

            return { success: true, processed: true, count: processedCount };
        } catch (error) {
            console.error('Error applying daily memory decay:', error);
            return { success: false };
        }
    }

    // 2つの日付文字列（YYYY-MM-DD形式）の差分日数を計算
    getDaysDifference(dateStr1, dateStr2) {
        const date1 = new Date(dateStr1);
        const date2 = new Date(dateStr2);
        const diffTime = Math.abs(date2 - date1);
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    }

    // 既存の単語データに記憶度フィールドを追加（データ移行）
    async migrateWordData() {
        try {
            const snapshot = await db.collection(COLLECTION_NAME).get();
            const batch = db.batch();
            let migratedCount = 0;

            snapshot.forEach(doc => {
                const data = doc.data();

                // memoryScoreまたはlastStudiedDateが存在しない場合のみ更新
                if (data.memoryScore === undefined || data.lastStudiedDate === undefined) {
                    const updates = {};

                    if (data.memoryScore === undefined) {
                        updates.memoryScore = 50.0;
                    }

                    if (data.lastStudiedDate === undefined) {
                        updates.lastStudiedDate = null;
                    }

                    batch.update(doc.ref, updates);
                    migratedCount++;
                }
            });

            if (migratedCount > 0) {
                await batch.commit();
                console.log(`データ移行完了: ${migratedCount}件の単語を更新`);
            } else {
                console.log('データ移行: 更新が必要な単語はありません');
            }

            return { success: true, count: migratedCount };
        } catch (error) {
            console.error('Error migrating word data:', error);
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

    // テストモードバナーを表示
    showTestModeBannerIfNeeded();
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

// テストモードバナーを表示（必要な場合）
function showTestModeBannerIfNeeded() {
    const isTestMode = localStorage.getItem('testMode') === 'true';

    if (isTestMode) {
        // バナーがまだ存在しない場合は作成
        let banner = document.getElementById('testModeBanner');

        if (!banner) {
            banner = document.createElement('div');
            banner.id = 'testModeBanner';
            banner.className = 'test-mode-banner';
            banner.innerHTML = `
                <span class="test-mode-icon">🧪</span>
                <span class="test-mode-text">テストモード</span>
            `;

            // containerの最初の子要素として挿入
            const container = document.querySelector('.container');
            if (container && container.firstChild) {
                container.insertBefore(banner, container.firstChild);
            }
        }

        banner.style.display = 'flex';
    }
}

// グローバルに利用できるようにエクスポート
window.StatsManager = StatsManager;
