import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyCBpv8MWQJOaVK5pIFRrW6G3pVUaRnYbGo",
  authDomain: "minka-creative.firebaseapp.com",
  projectId: "minka-creative",
  storageBucket: "minka-creative.firebasestorage.app",
  messagingSenderId: "1096624172314",
  appId: "1:1096624172314:web:45de1145147333844c50a3"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
