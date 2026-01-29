// テスト実行ページの機能
document.addEventListener('DOMContentLoaded', async function() {
    const testScreen = document.getElementById('testScreen');
    const resultScreen = document.getElementById('resultScreen');
    const currentQuestionSpan = document.getElementById('currentQuestion');
    const questionWord = document.getElementById('questionWord');
    const answerInput = document.getElementById('answerInput');
    const submitAnswerBtn = document.getElementById('submitAnswerBtn');
    const scoreValue = document.getElementById('scoreValue');
    const resultList = document.getElementById('resultList');

    // テスト状態
    let testWords = [];          // テストに使用する単語（10問分）
    let currentIndex = 0;        // 現在の問題番号（0-9）
    let results = [];            // 各問題の結果 [{word, translation, userAnswer, correct}, ...]
    let score = 0;               // 正解数

    const statsManager = new StatsManager();

    // テストモードかどうかを確認
    const isTestMode = localStorage.getItem('testMode') === 'true';

    // テストを初期化
    await initTest();

    // テスト初期化
    async function initTest() {
        const groupId = statsManager.getSelectedGroupId();
        const allWords = await statsManager.getWordsByGroup(groupId);

        if (allWords.length < 10) {
            alert('単語数が不足しています');
            window.location.href = 'test.html';
            return;
        }

        // ランダムに10問選択
        testWords = shuffleArray(allWords).slice(0, 10);

        // 最初の問題を表示
        showQuestion();

        // 入力欄にフォーカス
        answerInput.focus();
    }

    // 問題を表示
    function showQuestion() {
        const word = testWords[currentIndex];
        // 翻訳を表示（複数ある場合は " / " で区切る）
        const translationsStr = word.translations.join(' / ');
        questionWord.textContent = translationsStr;
        currentQuestionSpan.textContent = currentIndex + 1;
    }

    // 回答ボタンクリック
    submitAnswerBtn.addEventListener('click', handleAnswer);

    // Enterキーで回答
    answerInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            handleAnswer();
        }
    });

    // 回答処理
    async function handleAnswer() {
        const userAnswer = answerInput.value.trim().toLowerCase();
        const word = testWords[currentIndex];
        const correctAnswer = word.word.toLowerCase();

        // 正誤判定
        const isCorrect = userAnswer === correctAnswer;

        if (isCorrect) {
            score++;
        }

        // 結果を記録
        results.push({
            wordId: word.id,
            word: word.word,
            translations: word.translations,
            userAnswer: answerInput.value.trim(),
            correct: isCorrect,
            lastStudiedDate: word.lastStudiedDate
        });

        // 記憶度を更新（テストモードでない場合のみ）
        if (!isTestMode) {
            await updateMemoryScore(word, isCorrect);
        }

        // 入力欄をクリア
        answerInput.value = '';

        // 次の問題へ
        currentIndex++;

        if (currentIndex < 10) {
            // 次の問題を表示
            showQuestion();
            answerInput.focus();
        } else {
            // テスト終了、結果を表示
            showResults();
        }
    }

    // 記憶度を更新
    async function updateMemoryScore(word, isCorrect) {
        try {
            const today = statsManager.getTodayDateString();
            const isStudiedToday = word.lastStudiedDate === today;

            let scoreChange;
            if (isCorrect) {
                // 正解した場合
                scoreChange = isStudiedToday ? 2.5 : 25;
            } else {
                // 不正解の場合
                scoreChange = -25;
            }

            // Firestoreから現在の記憶度を取得して更新
            const docRef = db.collection('words').doc(word.id);
            const doc = await docRef.get();

            if (doc.exists) {
                const data = doc.data();
                const currentScore = data.memoryScore !== undefined ? data.memoryScore : 50.0;
                let newScore = currentScore + scoreChange;

                // 0~100の範囲に制限
                newScore = Math.max(0, Math.min(100, newScore));

                await docRef.update({
                    memoryScore: newScore,
                    lastStudiedDate: today
                });

                console.log(`記憶度更新: ${word.word} ${currentScore} -> ${newScore} (${scoreChange > 0 ? '+' : ''}${scoreChange})`);
            }
        } catch (error) {
            console.error('Error updating memory score:', error);
        }
    }

    // 結果を表示
    function showResults() {
        // 画面を切り替え
        testScreen.style.display = 'none';
        resultScreen.style.display = 'block';

        // スコアを表示
        scoreValue.textContent = score;

        // 結果リストを表示
        resultList.innerHTML = '';
        results.forEach((result, index) => {
            const resultItem = document.createElement('div');
            resultItem.className = 'result-item ' + (result.correct ? 'correct' : 'incorrect');

            const questionNum = document.createElement('span');
            questionNum.className = 'result-num';
            questionNum.textContent = `${index + 1}.`;

            const wordInfo = document.createElement('div');
            wordInfo.className = 'result-word-info';

            const translationSpan = document.createElement('span');
            translationSpan.className = 'result-translation';
            translationSpan.textContent = result.translations.join(' / ');

            const answerSpan = document.createElement('span');
            answerSpan.className = 'result-answer';

            if (result.correct) {
                answerSpan.textContent = `→ ${result.word}`;
            } else {
                answerSpan.innerHTML = `→ <span class="user-answer">${result.userAnswer || '(未回答)'}</span> <span class="correct-answer">(正解: ${result.word})</span>`;
            }

            wordInfo.appendChild(translationSpan);
            wordInfo.appendChild(answerSpan);

            resultItem.appendChild(questionNum);
            resultItem.appendChild(wordInfo);
            resultList.appendChild(resultItem);
        });
    }

    // 配列をシャッフル（Fisher-Yates）
    function shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }
});
