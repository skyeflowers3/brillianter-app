import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBAFN0p0alhkbRcOiyz6uoqw85T3TClVUE",
  authDomain: "brillianter-app.firebaseapp.com",
  projectId: "brillianter-app",
  storageBucket: "brillianter-app.firebasestorage.app",
  messagingSenderId: "736744749029",
  appId: "1:736744749029:web:f1244044c1d9b0edf1210c",
  measurementId: "G-5GKV9Y2VX3"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;
