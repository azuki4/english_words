// グループ管理ページの機能
document.addEventListener('DOMContentLoaded', async function() {
    const groupList = document.getElementById('groupList');
    const emptyMessage = document.getElementById('emptyMessage');

    if (groupList && emptyMessage) {
        await displayGroups();

        // Firestoreのリアルタイム更新を監視
        db.collection('groups').onSnapshot(async function() {
            await displayGroups();
        });
    }

    // グループを表示
    async function displayGroups() {
        const statsManager = new StatsManager();
        const groups = await statsManager.getGroups();
        const totalWords = await statsManager.getTotalWords();

        // グループリストをクリア
        groupList.innerHTML = '';

        // 「登録済み単語」グループを最初に表示（特殊グループ）
        const allWordsItem = createGroupItem({
            id: '__all__',
            name: '登録済み単語',
            wordCount: totalWords,
            isDefault: true
        });
        groupList.appendChild(allWordsItem);

        // ユーザー作成グループを表示
        for (const group of groups) {
            const groupItem = createGroupItem({
                id: group.id,
                name: group.name,
                wordCount: group.wordIds.length,
                isDefault: false
            });
            groupList.appendChild(groupItem);
        }

        // 空メッセージの表示制御（常に「登録済み単語」があるので非表示）
        emptyMessage.style.display = 'none';
    }

    // グループアイテムを作成
    function createGroupItem(groupData) {
        const groupItem = document.createElement('div');
        groupItem.className = 'group-item';

        // グループ情報コンテナ
        const groupInfo = document.createElement('div');
        groupInfo.className = 'group-info';

        const groupIcon = document.createElement('span');
        groupIcon.className = 'group-icon';
        groupIcon.textContent = '📁';

        const groupDetails = document.createElement('div');
        groupDetails.className = 'group-details';

        const groupName = document.createElement('div');
        groupName.className = 'group-name';
        groupName.textContent = groupData.name;

        const groupWordCount = document.createElement('div');
        groupWordCount.className = 'group-word-count';
        groupWordCount.textContent = `${groupData.wordCount}単語`;

        groupDetails.appendChild(groupName);
        groupDetails.appendChild(groupWordCount);

        groupInfo.appendChild(groupIcon);
        groupInfo.appendChild(groupDetails);

        groupItem.appendChild(groupInfo);

        // 削除ボタン（デフォルトグループ以外）
        if (!groupData.isDefault) {
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'btn-icon btn-delete';
            deleteBtn.innerHTML = '🗑️';
            deleteBtn.title = '削除';
            deleteBtn.addEventListener('click', async function(e) {
                e.stopPropagation();
                await deleteGroup(groupData);
            });
            groupItem.appendChild(deleteBtn);
        }

        return groupItem;
    }

    // グループを削除
    async function deleteGroup(groupData) {
        const confirmed = confirm(`「${groupData.name}」グループを削除してもよろしいですか？\n（単語自体は削除されません）`);

        if (confirmed) {
            const statsManager = new StatsManager();
            await statsManager.deleteGroup(groupData.id);
        }
    }
});
