// グループ追加ページの機能
document.addEventListener('DOMContentLoaded', async function() {
    const wordSelectionList = document.getElementById('wordSelectionList');
    const emptyMessage = document.getElementById('emptyMessage');
    const sortSelect = document.getElementById('sortSelect');
    const selectedCountSpan = document.getElementById('selectedCount');
    const createGroupBtn = document.getElementById('createGroupBtn');
    const groupNameModal = document.getElementById('groupNameModal');
    const groupNameInput = document.getElementById('groupNameInput');
    const cancelBtn = document.getElementById('cancelBtn');
    const confirmCreateBtn = document.getElementById('confirmCreateBtn');

    // 選択された単語IDを管理
    let selectedWordIds = new Set();

    // ソート設定をLocalStorageから復元
    const SORT_STORAGE_KEY = 'addGroupSortType';
    let currentSortType = localStorage.getItem(SORT_STORAGE_KEY) || 'alphabet';

    if (wordSelectionList && emptyMessage) {
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

        await displayWords();
    }

    // 単語を表示
    async function displayWords() {
        const statsManager = new StatsManager();
        const words = await statsManager.getWords();

        // 単語がない場合
        if (words.length === 0) {
            wordSelectionList.style.display = 'none';
            emptyMessage.style.display = 'block';
            return;
        }

        // ソート選択に応じてソート
        switch (currentSortType) {
            case 'date-new':
                words.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
                break;
            case 'date-old':
                words.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
                break;
            case 'alphabet':
            default:
                words.sort((a, b) => a.word.toLowerCase().localeCompare(b.word.toLowerCase()));
                break;
        }

        // 単語がある場合
        wordSelectionList.style.display = 'block';
        emptyMessage.style.display = 'none';

        // 単語リストを表示
        wordSelectionList.innerHTML = '';
        words.forEach(function(wordData) {
            const wordItem = document.createElement('div');
            wordItem.className = 'word-selection-item';
            wordItem.dataset.wordId = wordData.id;

            // 選択状態を復元
            if (selectedWordIds.has(wordData.id)) {
                wordItem.classList.add('selected');
            }

            // 単語情報
            const wordInfo = document.createElement('div');
            wordInfo.className = 'word-selection-info';

            const wordText = document.createElement('div');
            wordText.className = 'word-selection-text';
            wordText.textContent = wordData.word;

            const translationText = document.createElement('div');
            translationText.className = 'word-selection-translation';
            const translationsStr = wordData.translations && wordData.translations.length > 0
                ? wordData.translations.join(' / ')
                : '翻訳なし';
            translationText.textContent = translationsStr;

            wordInfo.appendChild(wordText);
            wordInfo.appendChild(translationText);
            wordItem.appendChild(wordInfo);

            // クリックで選択/解除
            wordItem.addEventListener('click', function() {
                toggleSelection(wordItem, wordData.id);
            });

            wordSelectionList.appendChild(wordItem);
        });

        updateSelectedCount();
    }

    // 選択をトグル
    function toggleSelection(wordItem, wordId) {
        if (selectedWordIds.has(wordId)) {
            selectedWordIds.delete(wordId);
            wordItem.classList.remove('selected');
        } else {
            selectedWordIds.add(wordId);
            wordItem.classList.add('selected');
        }
        updateSelectedCount();
    }

    // 選択数を更新
    function updateSelectedCount() {
        selectedCountSpan.textContent = selectedWordIds.size;
    }

    // グループ作成ボタンクリック
    createGroupBtn.addEventListener('click', function() {
        if (selectedWordIds.size === 0) {
            alert('単語を1つ以上選択してください');
            return;
        }
        groupNameInput.value = '';
        groupNameModal.style.display = 'flex';
        groupNameInput.focus();
    });

    // 戻るボタンクリック
    cancelBtn.addEventListener('click', function() {
        groupNameModal.style.display = 'none';
    });

    // モーダル外をクリックで閉じる
    groupNameModal.addEventListener('click', function(e) {
        if (e.target === groupNameModal) {
            groupNameModal.style.display = 'none';
        }
    });

    // グループを作成ボタンクリック
    confirmCreateBtn.addEventListener('click', async function() {
        const groupName = groupNameInput.value.trim();

        if (!groupName) {
            alert('グループ名を入力してください');
            return;
        }

        // グループを作成
        const statsManager = new StatsManager();
        const wordIds = Array.from(selectedWordIds);
        const result = await statsManager.createGroup(groupName, wordIds);

        if (result.success) {
            // グループ管理ページへ遷移
            window.location.href = 'group-management.html';
        } else {
            alert('グループの作成に失敗しました');
        }
    });

    // Enterキーでグループ作成
    groupNameInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            confirmCreateBtn.click();
        }
    });
});
