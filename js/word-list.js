// 単語一覧ページの機能
document.addEventListener('DOMContentLoaded', function() {
    const wordList = document.getElementById('wordList');
    const wordCount = document.getElementById('wordCount');
    const emptyMessage = document.getElementById('emptyMessage');

    if (wordList && wordCount && emptyMessage) {
        displayWords();
    }

    function displayWords() {
        const statsManager = new StatsManager();
        const words = statsManager.getWords();

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

        // アルファベット順にソート
        const sortedWords = words.sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));

        // 単語を表示
        wordList.innerHTML = '';
        sortedWords.forEach(function(word) {
            const wordItem = document.createElement('div');
            wordItem.className = 'word-item';
            wordItem.textContent = word;
            wordList.appendChild(wordItem);
        });
    }
});
