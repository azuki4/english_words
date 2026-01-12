// 単語一覧ページの機能
document.addEventListener('DOMContentLoaded', function() {
    const wordList = document.getElementById('wordList');
    const wordCount = document.getElementById('wordCount');
    const emptyMessage = document.getElementById('emptyMessage');

    if (wordList && wordCount && emptyMessage) {
        displayWords();

        // Firestoreのリアルタイム更新を監視
        db.collection('words').onSnapshot(function() {
            displayWords();
        });
    }

    async function displayWords() {
        const statsManager = new StatsManager();
        const words = await statsManager.getWords();

        // 単語数を表示
        wordCount.textContent = words.length;

        // 単語がない場合
        if (words.length === 0) {
            wordList.style.display = 'none';
            emptyMessage.style.display = 'block';
            return;
        }

        // 単語がある場合
        wordList.style.display = 'block';
        emptyMessage.style.display = 'none';

        // 単語を表示（既にアルファベット順にソート済み）
        wordList.innerHTML = '';
        words.forEach(function(wordData) {
            const wordItem = document.createElement('div');
            wordItem.className = 'word-item';

            const wordText = document.createElement('div');
            wordText.className = 'word-text';
            wordText.textContent = wordData.word;

            const translationText = document.createElement('div');
            translationText.className = 'translation-text';
            // 複数の翻訳を " / " で区切って表示
            const translationsStr = wordData.translations && wordData.translations.length > 0
                ? wordData.translations.join(' / ')
                : '翻訳なし';
            translationText.textContent = translationsStr;

            wordItem.appendChild(wordText);
            wordItem.appendChild(translationText);
            wordList.appendChild(wordItem);
        });
    }
});
