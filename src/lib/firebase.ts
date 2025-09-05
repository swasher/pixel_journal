// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore, collection, query, where, getDocs, writeBatch, deleteDoc } from "firebase/firestore";
import { getAuth, onAuthStateChanged, GoogleAuthProvider, deleteUser } from 'firebase/auth';
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
export const googleProvider = new GoogleAuthProvider();

// Svelte store для пользователя
// Оборачиваем логику в writable store.
// Код в `start` выполнится, когда у стора появится первый подписчик.
export const user = writable<any | null | undefined>(undefined, (set) => {
	const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
		set(currentUser);
	});

	// `stop` выполнится, когда последний подписчик отпишется.
	return () => unsubscribe();
});

export async function updateGameStatuses(userId: string, oldStatus: string, newStatus: string) {
  const gamesRef = collection(db, 'users', userId, 'games');
  const q = query(
    gamesRef,
    where("status", "==", oldStatus)
  );
  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    console.log(`No games found for user ${userId} with status ${oldStatus}. Nothing to update.`);
    return;
  }

  const docs = snapshot.docs;
  for (let i = 0; i < docs.length; i += 500) {
    const batch = writeBatch(db);
    const chunk = docs.slice(i, i + 500);
    chunk.forEach(doc => {
      batch.update(doc.ref, { status: newStatus });
    });
    await batch.commit();
  }

  console.log(`Batch update complete: ${snapshot.size} games updated from '${oldStatus}' to '${newStatus}'.`);
}


