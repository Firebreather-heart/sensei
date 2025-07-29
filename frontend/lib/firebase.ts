import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  // Using public Firebase configuration is okay for this frontend-only implementation
  apiKey: "AIzaSyDgYcaKz3YbXmK6QHnUDyoDZDX6RUKujSw",
  authDomain: "sensei-livecode.firebaseapp.com",
  projectId: "sensei-livecode",
  storageBucket: "sensei-livecode.appspot.com",
  messagingSenderId: "914813222232",
  appId: "1:914813222232:web:2b3456789012345678abcd",
  databaseURL: "https://sensei-livecode-default-rtdb.firebaseio.com"
};

// Initialize Firebase for client-side
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

export { database };
