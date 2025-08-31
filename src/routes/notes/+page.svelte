<script lang="ts">
	import MarkdownRenderer from '$lib/components/MarkdownRenderer.svelte';
	import MarkdownEditor from '$lib/components/MarkdownEditor.svelte';
	import { db, user } from '$lib/firebase'; // Импортируем user store
	import {
		doc,
		getDocs,
		setDoc,
		updateDoc,
		collection,
		query,
		where,
		addDoc
	} from 'firebase/firestore';
	import { Button, Modal } from 'flowbite-svelte';
	import { EditSolid } from 'flowbite-svelte-icons';

	let article = $state({ head: '', body: '' });
	let articleId = $state<string | null>(null); // Сохраняем ID найденного или созданного документа
	let isLoading = $state(true);
	let error = $state('');
	let isEditorOpen = $state(false);
	let currentUser = $derived(user);

	async function createArticle(uid: string) {
		console.log(`Attempting to create article for UID: ${uid}`);
		try {
			const newArticleData = {
				head: 'Мои заметки',
				body: 'Это место для ваших заметок. Нажмите кнопку редактирования, чтобы начать.',
				createdAt: new Date(),
				userId: uid // Добавляем userId в соответствии с правилами безопасности
			};
			// Создаем новый документ с авто-сгенерированным ID
			const docRef = await addDoc(collection(db, 'Articles'), newArticleData);
			console.log(`Article created successfully with ID: ${docRef.id} for UID: ${uid}`);
			
			// Обновляем локальное состояние
			articleId = docRef.id;
			article.head = newArticleData.head;
			article.body = newArticleData.body;

		} catch (e: any) {
			console.error('Error creating article:', e);
			error = 'Не удалось создать документ для заметок: ' + e.message;
		}
	}

	async function getArticle(uid: string) {
		console.log(`Attempting to query articles for UID: ${uid}`);
		try {
			const articlesRef = collection(db, 'Articles');
			const q = query(articlesRef, where('userId', '==', uid));
			const querySnapshot = await getDocs(q);

			if (!querySnapshot.empty) {
				// Документ найден
				const userArticleDoc = querySnapshot.docs[0];
				articleId = userArticleDoc.id;
				console.log(`Article found with ID: ${articleId} for UID: ${uid}`);
				
				const data = userArticleDoc.data();
				article.head = data.head || 'Заголовок не найден';
				article.body = data.body || 'Содержимое не найдено.';
			} else {
				// Документ не найден
				console.log(`Article not found for UID: ${uid}. Creating a new one.`);
				await createArticle(uid);
			}
		} catch (e: any)
		{
			console.error('Error getting article:', e);
			error = 'Ошибка загрузки документа: ' + e.message;
		} finally
		{
			isLoading = false;
		}
	}

	async function handleSave(data: { head: string; body: string }) {
		if (!$currentUser || !articleId) {
			alert('Ошибка: пользователь не аутентифицирован или документ не найден.');
			return;
		}
		console.log(`Attempting to save article with ID: ${articleId}`);
		try {
			const docRef = doc(db, 'Articles', articleId); // Используем сохраненный ID документа
			await updateDoc(docRef, {
				head: data.head,
				body: data.body
			});
			console.log(`Article saved successfully for ID: ${articleId}`);
			// Update local state to reflect changes immediately
			article.head = data.head;
			article.body = data.body;
		} catch (e: any) {
			console.error('Error saving article: ', e);
			alert('Ошибка сохранения: ' + e.message);
		} finally {
			isEditorOpen = false;
		}
	}

	$effect(() => {
		console.log('Notes page effect triggered. $currentUser:', $currentUser);

		// Case 1: Auth state is still initializing
		if ($currentUser === undefined) {
			console.log('Notes page: Auth state initializing. Waiting...');
			isLoading = true;
			error = ''; // Clear previous errors
			return;
		}

		// Case 2: User is logged out
		if ($currentUser === null) {
			console.log('Notes page: User is logged out.');
			isLoading = false;
			article = { head: '', body: '' };
			articleId = null;
			error = 'Пожалуйста, войдите в систему для просмотра заметок.';
			return;
		}

		// Case 3: User is logged in
		if ($currentUser && $currentUser.uid) {
			console.log(`Notes page: User is logged in with UID: ${$currentUser.uid}. Fetching article.`);
			isLoading = true;
			error = ''; // Clear previous errors
			getArticle($currentUser.uid);
		} else {
			// Fallback for unexpected states
			console.error('Notes page: $currentUser is in an unexpected state:', $currentUser);
			isLoading = false;
			error = 'Произошла непредвиденная ошибка аутентификации.';
		}
	});
</script>

<div class="container mx-auto px-4 py-4">
	{#if isLoading}
		<p>Загрузка заметок...</p>
	{:else if error}
		<div class="text-red-500">
			<h1 class="text-2xl font-bold mb-4">Ошибка при загрузке</h1>
			<p>{error}</p>
		</div>
	{:else}
		<article class="prose dark:prose-invert max-w-prose mx-auto">
			<div class="mb-6 flex w-full items-center justify-between border-b border-gray-700 pb-2">
				<h1 class="text-4xl font-bold text-primary-600 dark:text-secondary-600 m-0 !mb-0">
					{article.head}
				</h1>
				<Button size="xs" color="alternative" class="p-1" onclick={() => isEditorOpen = true}>
					<EditSolid class="h-5 w-5" />
				</Button>
			</div>
			<MarkdownRenderer text={article.body} />
		</article>
	{/if}
</div>

{#if isEditorOpen}
	<Modal title="" bind:open={isEditorOpen} size="7xl" permanent={true}>
		<div class="h-[80vh]">
			<MarkdownEditor 
				head={article.head} 
				body={article.body} 
				onSave={handleSave} 
				onCancel={() => isEditorOpen = false} 
			/>
		</div>
	</Modal>
{/if}