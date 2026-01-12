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

        async function addWord() {
            const word = wordInput.value.trim();

            // 入力チェック
            if (!word) {
                return;
            }

            // ボタンを無効化（連続クリック防止）
            addBtn.disabled = true;
            addBtn.textContent = '追加中...';

            try {
                // StatsManagerを使って単語を追加
                const statsManager = new StatsManager();
                const result = await statsManager.addWord(word);

                // 入力欄をクリア
                wordInput.value = '';

                if (result.success) {
                    // 成功メッセージに翻訳を表示
                    successMessage.innerHTML = `<strong>${word}</strong><br><span style="color: #667eea;">${result.translation}</span>`;
                    successMessage.style.display = 'block';
                    setTimeout(function() {
                        successMessage.style.display = 'none';
                    }, 3000);
                } else {
                    // 既に存在する場合
                    alert('この単語は既に登録されています');
                }

                // 入力欄にフォーカス
                wordInput.focus();
            } catch (error) {
                console.error('Error adding word:', error);
                alert('単語の追加に失敗しました');
            } finally {
                // ボタンを有効化
                addBtn.disabled = false;
                addBtn.textContent = '追加';
            }
        }
    }
});
