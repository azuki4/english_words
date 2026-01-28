// 学習ページの機能
document.addEventListener('DOMContentLoaded', async function() {
    const studyGroupSelect = document.getElementById('studyGroupSelect');

    if (studyGroupSelect) {
        await loadGroups();

        // グループ選択変更時のイベントリスナー
        studyGroupSelect.addEventListener('change', function() {
            const statsManager = new StatsManager();
            statsManager.setSelectedGroupId(studyGroupSelect.value);
        });
    }

    // グループを読み込んでセレクトボックスに追加
    async function loadGroups() {
        const statsManager = new StatsManager();
        const groups = await statsManager.getGroups();
        const selectedGroupId = statsManager.getSelectedGroupId();

        // 既存のオプションをクリア（「登録済み単語」以外）
        while (studyGroupSelect.options.length > 1) {
            studyGroupSelect.remove(1);
        }

        // ユーザー作成グループを追加
        groups.forEach(group => {
            const option = document.createElement('option');
            option.value = group.id;
            option.textContent = `${group.name}（${group.wordIds.length}単語）`;
            studyGroupSelect.appendChild(option);
        });

        // 選択中のグループを復元
        studyGroupSelect.value = selectedGroupId;

        // 選択中のグループが存在しない場合は「登録済み単語」に戻す
        if (studyGroupSelect.value !== selectedGroupId) {
            studyGroupSelect.value = '__all__';
            statsManager.setSelectedGroupId('__all__');
        }
    }
});
