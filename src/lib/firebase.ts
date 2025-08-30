// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, onAuthStateChanged, type User } from "firebase/auth";
import { writable } from 'svelte/store';

// Your web app's Firebase configuration
const firebaseConfig = {
	apiKey: import.meta.env.VITE_API_KEY,
	authDomain: import.meta.env.VITE_AUTH_DOMAIN,
	projectId: import.meta.env.VITE_PROJECT_ID,
	storageBucket: import.meta.env.VITE_STORAGE_BUCKET,
	messagingSenderId: import.meta.env.VITE_MESSAGING_SENDER_ID,
	appId: import.meta.env.VITE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Экспортируем сервисы, которые вы будете использовать
export const db = getFirestore(app);
export const auth = getAuth(app);

// Svelte store для пользователя
// Оборачиваем логику в writable store.
// Код в `start` выполнится, когда у стора появится первый подписчик.
export const user = writable<User | null | undefined>(undefined, (set) => {
	const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
		set(currentUser);
	});

	// `stop` выполнится, когда последний подписчик отпишется.
	return () => unsubscribe();
});