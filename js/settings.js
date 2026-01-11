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
        confirmYes.addEventListener('click', async function() {
            // ボタンを無効化
            confirmYes.disabled = true;
            confirmYes.textContent = 'リセット中...';

            try {
                const statsManager = new StatsManager();
                await statsManager.resetStats();

                // 確認ダイアログを非表示
                resetConfirm.style.display = 'none';
                resetBtn.style.display = 'flex';

                // メインページに戻る
                window.location.href = 'index.html';
            } catch (error) {
                console.error('Error resetting data:', error);
                alert('データのリセットに失敗しました');

                // ボタンを有効化
                confirmYes.disabled = false;
                confirmYes.textContent = 'はい';
            }
        });

        // 「いいえ」ボタンをクリック
        confirmNo.addEventListener('click', function() {
            // 確認ダイアログを非表示
            resetConfirm.style.display = 'none';
            resetBtn.style.display = 'flex';
        });
    }
});
