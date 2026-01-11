// 設定ページの機能
document.addEventListener('DOMContentLoaded', function() {
    const resetBtn = document.getElementById('resetBtn');
    const resetConfirm = document.getElementById('resetConfirm');
    const confirmYes = document.getElementById('confirmYes');
    const confirmNo = document.getElementById('confirmNo');

    if (resetBtn && resetConfirm && confirmYes && confirmNo) {
        // リセットボタンをクリック
        resetBtn.addEventListener('click', function() {
            // 確認ダイアログを表示
            resetConfirm.style.display = 'block';
            resetBtn.style.display = 'none';
        });

        // 「はい」ボタンをクリック
        confirmYes.addEventListener('click', function() {
            const statsManager = new StatsManager();
            statsManager.resetStats();

            // 確認ダイアログを非表示
            resetConfirm.style.display = 'none';
            resetBtn.style.display = 'flex';

            // メインページに戻る
            window.location.href = 'index.html';
        });

        // 「いいえ」ボタンをクリック
        confirmNo.addEventListener('click', function() {
            // 確認ダイアログを非表示
            resetConfirm.style.display = 'none';
            resetBtn.style.display = 'flex';
        });
    }
});
