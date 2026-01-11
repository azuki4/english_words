// 単語を追加するページの機能
document.addEventListener('DOMContentLoaded', function() {
    const wordInput = document.getElementById('wordInput');
    const addBtn = document.getElementById('addBtn');
    const successMessage = document.getElementById('successMessage');

    if (wordInput && addBtn && successMessage) {
        // 追加ボタンをクリック
        addBtn.addEventListener('click', function() {
            addWord();
        });

        // Enterキーでも追加
        wordInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                addWord();
            }
        });

        function addWord() {
            const word = wordInput.value.trim();

            // 入力チェック
            if (!word) {
                return;
            }

            // StatsManagerを使って単語を追加
            const statsManager = new StatsManager();
            statsManager.addWord(word);

            // 入力欄をクリア
            wordInput.value = '';

            // 成功メッセージを表示
            successMessage.style.display = 'block';
            setTimeout(function() {
                successMessage.style.display = 'none';
            }, 2000);

            // 入力欄にフォーカス
            wordInput.focus();
        }
    }
});
