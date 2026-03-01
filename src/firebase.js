import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyCgkHETH0QXC4JrhCEoIwxjO2afZWutVeI",
  authDomain: "akshi-robot.firebaseapp.com",
  databaseURL: "https://akshi-robot-default-rtdb.firebaseio.com",
  projectId: "akshi-robot",
  storageBucket: "akshi-robot.firebasestorage.app",
  messagingSenderId: "925974029099",
  appId: "1:925974029099:web:aa64dd611401964d50db6e"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);

export const database = getDatabase(app);