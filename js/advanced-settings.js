// 詳細設定ページの機能
document.addEventListener('DOMContentLoaded', function() {
    const testModeToggle = document.getElementById('testModeToggle');
    const testModeNotice = document.getElementById('testModeNotice');
    const testModeBanner = document.getElementById('testModeBanner');

    // テストモードの状態をlocalStorageから読み込み
    const isTestMode = localStorage.getItem('testMode') === 'true';
    testModeToggle.checked = isTestMode;

    // 初期状態で通知とバナーを表示
    updateTestModeUI(isTestMode);

    // トグルスイッチの変更イベント
    testModeToggle.addEventListener('change', function() {
        const newTestMode = this.checked;

        // localStorageに保存
        localStorage.setItem('testMode', newTestMode);

        // UI更新
        updateTestModeUI(newTestMode);

        // 変更を通知
        if (newTestMode) {
            console.log('✅ テストモードを有効にしました');
        } else {
            console.log('✅ テストモードを無効にしました');
        }
    });

    // テストモードUIの更新
    function updateTestModeUI(isEnabled) {
        if (isEnabled) {
            testModeNotice.style.display = 'flex';
            testModeBanner.style.display = 'flex';
        } else {
            testModeNotice.style.display = 'none';
            testModeBanner.style.display = 'none';
        }
    }
});

// グローバル関数：テストモードかどうかを判定
window.isTestMode = function() {
    return localStorage.getItem('testMode') === 'true';
};

// グローバル関数：テストモードバナーを表示
window.showTestModeBanner = function() {
    const banner = document.getElementById('testModeBanner');
    if (banner && window.isTestMode()) {
        banner.style.display = 'flex';
    }
};
