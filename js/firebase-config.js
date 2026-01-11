// Firebase設定ファイル
// TODO: Firebaseコンソールから取得した設定情報に置き換えてください

const firebaseConfig = {
  apiKey: "AIzaSyBFe2MmzONxW0Dc4dx6Js_hTeaGCzE28SI",
  authDomain: "english-words-c5412.firebaseapp.com",
  projectId: "english-words-c5412",
  storageBucket: "english-words-c5412.firebasestorage.app",
  messagingSenderId: "244244726348",
  appId: "1:244244726348:web:c3e3d00d6a832603f16ae9"
};

// Firebase設定の確認
if (firebaseConfig.apiKey === "YOUR_API_KEY") {
    console.error('⚠️ Firebase設定が未設定です！');
    console.error('js/firebase-config.js を開いて、Firebaseコンソールから取得した設定情報に置き換えてください。');
    alert('Firebase設定が未設定です。\n詳細はブラウザのコンソール（F12）を確認してください。');
} else {
    console.log('✅ Firebase設定が読み込まれました');
    console.log('プロジェクトID:', firebaseConfig.projectId);
}

// Firebaseの初期化
try {
    firebase.initializeApp(firebaseConfig);
    console.log('✅ Firebaseが初期化されました');

    // Firestoreのインスタンスを取得
    const db = firebase.firestore();
    console.log('✅ Firestoreが初期化されました');

    // グローバルに利用できるようにエクスポート
    window.db = db;
} catch (error) {
    console.error('❌ Firebase初期化エラー:', error);
    alert('Firebase初期化エラー: ' + error.message);
}
