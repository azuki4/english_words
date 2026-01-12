// 単語を追加するページの機能
document.addEventListener('DOMContentLoaded', function() {
    const wordInput = document.getElementById('wordInput');
    const translationsContainer = document.getElementById('translationsContainer');
    const addTranslationBtn = document.getElementById('addTranslationBtn');
    const submitBtn = document.getElementById('submitBtn');
    const successMessage = document.getElementById('successMessage');

    let translationCount = 1; // 初期状態で1つの入力欄がある

    // 日本語訳を追加
    addTranslationBtn.addEventListener('click', function() {
        const inputGroup = document.createElement('div');
        inputGroup.className = 'translation-input-group';
        inputGroup.innerHTML = `
            <input type="text" class="translation-input" placeholder="例: 経営する" data-index="${translationCount}">
            <button class="remove-translation-btn" data-index="${translationCount}">削除</button>
        `;
        translationsContainer.appendChild(inputGroup);
        translationCount++;

        // 削除ボタンのイベントリスナーを追加
        const removeBtn = inputGroup.querySelector('.remove-translation-btn');
        removeBtn.addEventListener('click', function() {
            inputGroup.remove();
        });
    });

    // Enterキーで次の入力欄に移動
    wordInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            const firstTranslationInput = translationsContainer.querySelector('.translation-input');
            if (firstTranslationInput) {
                firstTranslationInput.focus();
            }
        }
    });

    // 登録ボタン
    submitBtn.addEventListener('click', async function() {
        await submitWord();
    });

    async function submitWord() {
        const word = wordInput.value.trim();

        // 英単語の入力チェック
        if (!word) {
            alert('英単語を入力してください');
            wordInput.focus();
            return;
        }

        // 日本語訳を収集
        const translationInputs = translationsContainer.querySelectorAll('.translation-input');
        const translations = [];

        translationInputs.forEach(input => {
            const translation = input.value.trim();
            if (translation) {
                translations.push(translation);
            }
        });

        // 日本語訳が最低1つあるかチェック
        if (translations.length === 0) {
            alert('日本語訳を最低1つ入力してください');
            const firstTranslationInput = translationsContainer.querySelector('.translation-input');
            if (firstTranslationInput) {
                firstTranslationInput.focus();
            }
            return;
        }

        // ボタンを無効化（連続クリック防止）
        submitBtn.disabled = true;
        submitBtn.textContent = '登録中...';

        try {
            // StatsManagerを使って単語を追加
            const statsManager = new StatsManager();
            const result = await statsManager.addWord(word, translations);

            if (result.success) {
                // 成功メッセージを表示
                successMessage.innerHTML = `<strong>${word}</strong><br><span style="color: #667eea;">${translations.join(' / ')}</span>`;
                successMessage.style.display = 'block';
                setTimeout(function() {
                    successMessage.style.display = 'none';
                }, 3000);

                // 入力欄をクリア
                wordInput.value = '';

                // 日本語訳入力欄を初期状態に戻す
                translationsContainer.innerHTML = `
                    <div class="translation-input-group">
                        <input type="text" class="translation-input" placeholder="例: 走る" data-index="0">
                    </div>
                `;
                translationCount = 1;

                // 英単語入力欄にフォーカス
                wordInput.focus();
            } else {
                // 既に存在する場合
                alert('この単語は既に登録されています');
            }
        } catch (error) {
            console.error('Error adding word:', error);
            alert('単語の追加に失敗しました');
        } finally {
            // ボタンを有効化
            submitBtn.disabled = false;
            submitBtn.textContent = '登録';
        }
    }
});
