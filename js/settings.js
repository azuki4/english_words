// 設定ページの機能
document.addEventListener('DOMContentLoaded', function() {
    const resetBtn = document.getElementById('resetBtn');

    if (resetBtn) {
        resetBtn.addEventListener('click', function() {
            // 確認ダイアログを表示
            if (confirm('本当に全ての学習データをリセットしますか？\nこの操作は取り消せません。')) {
                const statsManager = new StatsManager();
                statsManager.resetStats();

                // 表示を更新
                updateDisplay(statsManager);

                // フィードバック
                alert('学習データをリセットしました。');
            }
        });
    }
});
