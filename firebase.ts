
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyAl1JX9sszHydIx2yaGFaA-7TRqXnTaOBk",
  authDomain: "studio-6485629284-94d34.firebaseapp.com",
  databaseURL: "https://studio-6485629284-94d34-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "studio-6485629284-94d34",
  storageBucket: "studio-6485629284-94d34.firebasestorage.app",
  messagingSenderId: "719651549796",
  appId: "1:719651549796:web:f246b7fd9520c24078e571"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
