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

// Firebaseの初期化
firebase.initializeApp(firebaseConfig);

// Firestoreのインスタンスを取得
const db = firebase.firestore();

// グローバルに利用できるようにエクスポート
window.db = db;