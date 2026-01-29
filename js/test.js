// テストページの機能
document.addEventListener('DOMContentLoaded', async function() {
    const testGroupSelect = document.getElementById('testGroupSelect');
    const startTestBtn = document.getElementById('startTestBtn');

    if (testGroupSelect) {
        await loadGroups();

        // グループ選択変更時のイベントリスナー
        testGroupSelect.addEventListener('change', function() {
            const statsManager = new StatsManager();
            statsManager.setSelectedGroupId(testGroupSelect.value);
        });
    }

    // テスト開始ボタンのクリック処理
    if (startTestBtn) {
        startTestBtn.addEventListener('click', async function(e) {
            const statsManager = new StatsManager();
            const groupId = statsManager.getSelectedGroupId();
            const words = await statsManager.getWordsByGroup(groupId);

            if (words.length < 10) {
                e.preventDefault();
                alert(`テストには10単語以上必要です。\n現在の単語数: ${words.length}単語`);
                return;
            }
        });
    }

    // グループを読み込んでセレクトボックスに追加
    async function loadGroups() {
        const statsManager = new StatsManager();
        const groups = await statsManager.getGroups();
        const selectedGroupId = statsManager.getSelectedGroupId();

        // 既存のオプションをクリア（「登録済み単語」以外）
        while (testGroupSelect.options.length > 1) {
            testGroupSelect.remove(1);
        }

        // ユーザー作成グループを追加
        groups.forEach(group => {
            const option = document.createElement('option');
            option.value = group.id;
            option.textContent = `${group.name}（${group.wordIds.length}単語）`;
            testGroupSelect.appendChild(option);
        });

        // 選択中のグループを復元
        testGroupSelect.value = selectedGroupId;

        // 選択中のグループが存在しない場合は「登録済み単語」に戻す
        if (testGroupSelect.value !== selectedGroupId) {
            testGroupSelect.value = '__all__';
            statsManager.setSelectedGroupId('__all__');
        }
    }
});
