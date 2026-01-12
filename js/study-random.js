// 完全ランダム学習ページの機能
document.addEventListener('DOMContentLoaded', async function() {
    const wordDisplay = document.getElementById('wordDisplay');
    const translationDisplay = document.getElementById('translationDisplay');
    const showTranslationBtn = document.getElementById('showTranslationBtn');
    const ratingButtons = document.getElementById('ratingButtons');
    const emptyMessage = document.getElementById('emptyMessage');

    let allWords = [];
    let currentWord = null;

    // 日次減衰処理を実行（ページ読み込み時に1回のみ）
    const statsManager = new StatsManager();
    await statsManager.applyDailyMemoryDecay();

    // 単語を読み込み
    await loadWords();

    // 単語がある場合、最初の単語を表示
    if (allWords.length > 0) {
        showRandomWord();
    }

    // 日本語訳を表示ボタン
    showTranslationBtn.addEventListener('click', function() {
        showTranslation();
    });

    // 4段階評価ボタン
    const ratingBtns = document.querySelectorAll('.rating-btn');
    ratingBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const rating = parseInt(this.dataset.rating);
            handleRating(rating);
        });
    });

    // 単語を読み込む
    async function loadWords() {
        try {
            const statsManager = new StatsManager();
            allWords = await statsManager.getWords();

            if (allWords.length === 0) {
                // 単語がない場合
                wordDisplay.parentElement.style.display = 'none';
                document.querySelector('.action-buttons').style.display = 'none';
                emptyMessage.style.display = 'block';
            }
        } catch (error) {
            console.error('Error loading words:', error);
            wordDisplay.textContent = '単語の読み込みに失敗しました';
        }
    }

    // ランダムに単語を表示
    function showRandomWord() {
        if (allWords.length === 0) return;

        // ランダムに単語を選択
        const randomIndex = Math.floor(Math.random() * allWords.length);
        currentWord = allWords[randomIndex];

        // 英単語を表示
        wordDisplay.textContent = currentWord.word;

        // 日本語訳を非表示
        translationDisplay.style.display = 'none';
        translationDisplay.textContent = '';

        // ボタンの状態をリセット
        showTranslationBtn.style.display = 'block';
        ratingButtons.style.display = 'none';
    }

    // 日本語訳を表示
    function showTranslation() {
        if (!currentWord) return;

        // 日本語訳を表示
        const translationsStr = currentWord.translations.join(' / ');
        translationDisplay.textContent = translationsStr;
        translationDisplay.style.display = 'block';

        // ボタンを切り替え
        showTranslationBtn.style.display = 'none';
        ratingButtons.style.display = 'grid';
    }

    // 4段階評価を処理
    async function handleRating(rating) {
        console.log(`評価: ${rating}, 単語: ${currentWord.word}`);

        const statsManager = new StatsManager();

        // 記憶度を更新
        await statsManager.updateMemoryScore(currentWord.id, rating);

        // 今日の学習カウントをインクリメント（Firestore使用）
        await statsManager.incrementTodayStudy();

        // 単語リストを再読み込み（記憶度が更新されたため）
        await loadWords();

        // 次の単語を表示
        showRandomWord();
    }
});
