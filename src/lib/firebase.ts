import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: 'AIzaSyA6GdlxJvwMFw3Ehi6S-3bwXrIaVNLT5zk',
  appId: '1:1002999066317:web:d8bfcca9653022f7b90384',
  messagingSenderId: '1002999066317',
  projectId: 'pourfect-9c538',
  authDomain: 'pourfect-9c538.firebaseapp.com',
  storageBucket: 'pourfect-9c538.firebasestorage.app',
  measurementId: 'G-V7VRCQSDZL',
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
