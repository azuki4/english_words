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
        words.forEach(function(word) {
            const wordItem = document.createElement('div');
            wordItem.className = 'word-item';
            wordItem.textContent = word;
            wordList.appendChild(wordItem);
        });
    }
});
