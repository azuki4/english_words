// 単語一覧ページの機能
document.addEventListener('DOMContentLoaded', async function() {
    const wordList = document.getElementById('wordList');
    const wordCount = document.getElementById('wordCount');
    const emptyMessage = document.getElementById('emptyMessage');
    const sortSelect = document.getElementById('sortSelect');

    // 編集モーダル関連
    const editModal = document.getElementById('editModal');
    const closeModal = document.getElementById('closeModal');
    const cancelEditBtn = document.getElementById('cancelEditBtn');
    const saveEditBtn = document.getElementById('saveEditBtn');
    const editWord = document.getElementById('editWord');
    const editTranslationsContainer = document.getElementById('editTranslationsContainer');
    const addEditTranslationBtn = document.getElementById('addEditTranslationBtn');

    let currentEditingId = null;
    let editTranslationCount = 0;

    // ソート設定をLocalStorageから復元
    const SORT_STORAGE_KEY = 'wordListSortType';
    let currentSortType = localStorage.getItem(SORT_STORAGE_KEY) || 'alphabet';

    if (wordList && wordCount && emptyMessage) {
        // ソート選択の初期値を設定
        if (sortSelect) {
            sortSelect.value = currentSortType;

            // ソート選択変更時のイベントリスナー
            sortSelect.addEventListener('change', async function() {
                currentSortType = sortSelect.value;
                localStorage.setItem(SORT_STORAGE_KEY, currentSortType);
                await displayWords();
            });
        }

        // データ移行処理を実行（既存データに記憶度フィールドを追加）
        const statsManager = new StatsManager();
        await statsManager.migrateWordData();

        await displayWords();

        // Firestoreのリアルタイム更新を監視
        db.collection('words').onSnapshot(async function() {
            await displayWords();
        });
    }

    // 単語を表示
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

        // ソート選択に応じてソート
        switch (currentSortType) {
            case 'date-new':
                // 登録日順（新しい順）
                words.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
                break;
            case 'date-old':
                // 登録日順（古い順）
                words.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
                break;
            case 'alphabet':
            default:
                // アルファベット順（getWords()で既にソート済みだが念のため）
                words.sort((a, b) => a.word.toLowerCase().localeCompare(b.word.toLowerCase()));
                break;
        }

        // 単語を表示（既にアルファベット順にソート済み）
        wordList.innerHTML = '';
        words.forEach(function(wordData) {
            const wordItem = document.createElement('div');
            wordItem.className = 'word-item';

            // 単語情報コンテナ
            const wordInfo = document.createElement('div');
            wordInfo.className = 'word-info';

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

            wordInfo.appendChild(wordText);
            wordInfo.appendChild(translationText);

            // ボタンコンテナ
            const buttonContainer = document.createElement('div');
            buttonContainer.className = 'word-actions';

            // 編集ボタン
            const editBtn = document.createElement('button');
            editBtn.className = 'btn-icon btn-edit';
            editBtn.innerHTML = '✏️';
            editBtn.title = '編集';
            editBtn.addEventListener('click', function() {
                openEditModal(wordData);
            });

            // 削除ボタン
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'btn-icon btn-delete';
            deleteBtn.innerHTML = '🗑️';
            deleteBtn.title = '削除';
            deleteBtn.addEventListener('click', function() {
                deleteWord(wordData);
            });

            buttonContainer.appendChild(editBtn);
            buttonContainer.appendChild(deleteBtn);

            wordItem.appendChild(wordInfo);
            wordItem.appendChild(buttonContainer);
            wordList.appendChild(wordItem);
        });
    }

    // 編集モーダルを開く
    function openEditModal(wordData) {
        currentEditingId = wordData.id;
        editWord.value = wordData.word;

        // 翻訳入力欄をクリア
        editTranslationsContainer.innerHTML = '';
        editTranslationCount = 0;

        // 既存の翻訳を表示
        if (wordData.translations && wordData.translations.length > 0) {
            wordData.translations.forEach(function(translation) {
                addEditTranslationInput(translation);
            });
        } else {
            // 翻訳がない場合は1つ追加
            addEditTranslationInput('');
        }

        editModal.style.display = 'flex';
    }

    // 編集用の翻訳入力欄を追加
    function addEditTranslationInput(value = '') {
        const inputGroup = document.createElement('div');
        inputGroup.className = 'translation-input-group';

        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'translation-input';
        input.placeholder = '例: 走る';
        input.value = value;
        input.dataset.index = editTranslationCount;

        inputGroup.appendChild(input);

        // 削除ボタン（2つ目以降のみ）
        if (editTranslationCount > 0) {
            const removeBtn = document.createElement('button');
            removeBtn.className = 'remove-translation-btn';
            removeBtn.textContent = '削除';
            removeBtn.dataset.index = editTranslationCount;
            removeBtn.addEventListener('click', function() {
                inputGroup.remove();
            });
            inputGroup.appendChild(removeBtn);
        }

        editTranslationsContainer.appendChild(inputGroup);
        editTranslationCount++;
    }

    // 翻訳を追加ボタン
    addEditTranslationBtn.addEventListener('click', function() {
        addEditTranslationInput('');
    });

    // モーダルを閉じる
    function closeEditModal() {
        editModal.style.display = 'none';
        currentEditingId = null;
        editWord.value = '';
        editTranslationsContainer.innerHTML = '';
        editTranslationCount = 0;
    }

    closeModal.addEventListener('click', closeEditModal);
    cancelEditBtn.addEventListener('click', closeEditModal);

    // モーダル外をクリックで閉じる
    editModal.addEventListener('click', function(e) {
        if (e.target === editModal) {
            closeEditModal();
        }
    });

    // 保存ボタン
    saveEditBtn.addEventListener('click', async function() {
        const word = editWord.value.trim();

        if (!word) {
            alert('英単語を入力してください');
            return;
        }

        // 翻訳を収集
        const translationInputs = editTranslationsContainer.querySelectorAll('.translation-input');
        const translations = [];
        translationInputs.forEach(input => {
            const translation = input.value.trim();
            if (translation) {
                translations.push(translation);
            }
        });

        if (translations.length === 0) {
            alert('日本語訳を最低1つ入力してください');
            return;
        }

        // 単語を更新
        const statsManager = new StatsManager();
        const result = await statsManager.updateWord(currentEditingId, word, translations);

        if (result.success) {
            closeEditModal();
        }
    });

    // 単語を削除
    async function deleteWord(wordData) {
        const confirmed = confirm(`「${wordData.word}」を削除してもよろしいですか？`);

        if (confirmed) {
            const statsManager = new StatsManager();
            await statsManager.deleteWord(wordData.id);
        }
    }
});
