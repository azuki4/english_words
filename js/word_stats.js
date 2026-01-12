// 単語の内部情報ページの機能
document.addEventListener('DOMContentLoaded', async function() {
    const wordStatsList = document.getElementById('wordStatsList');
    const wordCount = document.getElementById('wordCount');
    const emptyMessage = document.getElementById('emptyMessage');

    if (wordStatsList && wordCount && emptyMessage) {
        await displayWordStats();

        // Firestoreのリアルタイム更新を監視
        db.collection('words').onSnapshot(async function() {
            await displayWordStats();
        });
    }

    async function displayWordStats() {
        const statsManager = new StatsManager();
        const words = await statsManager.getWords();

        // 単語数を表示
        wordCount.textContent = words.length;

        // 単語がない場合
        if (words.length === 0) {
            wordStatsList.style.display = 'none';
            emptyMessage.style.display = 'block';
            return;
        }

        // 単語がある場合
        wordStatsList.style.display = 'block';
        emptyMessage.style.display = 'none';

        // 記憶度の昇順でソート
        words.sort((a, b) => {
            const scoreA = a.memoryScore !== undefined ? a.memoryScore : 50.0;
            const scoreB = b.memoryScore !== undefined ? b.memoryScore : 50.0;
            return scoreA - scoreB;
        });

        // 単語を表示
        wordStatsList.innerHTML = '';
        words.forEach(function(wordData) {
            const statsItem = document.createElement('div');
            statsItem.className = 'word-stats-item';

            // 記憶度に応じた色分け
            const memoryScore = wordData.memoryScore !== undefined ? wordData.memoryScore : 50.0;
            if (memoryScore < 30) {
                statsItem.classList.add('score-low');
            } else if (memoryScore < 60) {
                statsItem.classList.add('score-medium');
            } else if (memoryScore < 80) {
                statsItem.classList.add('score-good');
            } else {
                statsItem.classList.add('score-excellent');
            }

            // 単語情報
            const wordInfo = document.createElement('div');
            wordInfo.className = 'word-stats-info';

            const wordText = document.createElement('div');
            wordText.className = 'word-text-large';
            wordText.textContent = wordData.word;

            const translationText = document.createElement('div');
            translationText.className = 'translation-text-small';
            const translationsStr = wordData.translations && wordData.translations.length > 0
                ? wordData.translations.join(' / ')
                : '翻訳なし';
            translationText.textContent = translationsStr;

            wordInfo.appendChild(wordText);
            wordInfo.appendChild(translationText);

            // 記憶度情報
            const statsData = document.createElement('div');
            statsData.className = 'word-stats-data';

            const scoreContainer = document.createElement('div');
            scoreContainer.className = 'stats-score';

            const scoreLabel = document.createElement('div');
            scoreLabel.className = 'stats-label';
            scoreLabel.textContent = '記憶度';

            const scoreValue = document.createElement('div');
            scoreValue.className = 'stats-value';
            scoreValue.textContent = memoryScore.toFixed(1);

            scoreContainer.appendChild(scoreLabel);
            scoreContainer.appendChild(scoreValue);

            // 最後に学習した日付
            const dateContainer = document.createElement('div');
            dateContainer.className = 'stats-date';

            const dateLabel = document.createElement('div');
            dateLabel.className = 'stats-label';
            dateLabel.textContent = '最終学習日';

            const dateValue = document.createElement('div');
            dateValue.className = 'stats-value-small';
            dateValue.textContent = wordData.lastStudiedDate || '未学習';

            dateContainer.appendChild(dateLabel);
            dateContainer.appendChild(dateValue);

            statsData.appendChild(scoreContainer);
            statsData.appendChild(dateContainer);

            statsItem.appendChild(wordInfo);
            statsItem.appendChild(statsData);
            wordStatsList.appendChild(statsItem);
        });
    }
});
