<script lang="ts">
	import MarkdownRenderer from '$lib/components/MarkdownRenderer.svelte';
	import MarkdownEditor from '$lib/components/MarkdownEditor.svelte';
	import { db, user } from '$lib/firebase';
	import { doc, getDoc, updateDoc } from 'firebase/firestore';
	import { Button, Modal } from 'flowbite-svelte';
	import { EditSolid } from 'flowbite-svelte-icons';

	const GENERAL_NOTE_ID = 'general';

	let article = $state({ head: '', body: '' });
	let isLoading = $state(true);
	let error = $state('');
	let isEditorOpen = $state(false);
	let currentUser = $derived(user);

	async function getGeneralNote(uid: string) {
		isLoading = true;
		error = '';
		console.log(`Attempting to get general note for UID: ${uid}`);
		try {
			const noteRef = doc(db, 'users', uid, 'articles', GENERAL_NOTE_ID);
			const docSnap = await getDoc(noteRef);

			if (docSnap.exists()) {
				const data = docSnap.data();
				article.head = data.head || 'Заголовок не найден';
				article.body = data.body || 'Содержимое не найдено.';
				console.log(`General note found for UID: ${uid}`);
			} else {
                // This case should ideally not happen if user creation logic is correct
				console.error(`General note not found for UID: ${uid}. This is unexpected.`);
                error = 'Не удалось найти основной документ для заметок. Возможно, он не был создан. Обратитесь в поддержку.';
			}
		} catch (e: any) {
			console.error('Error getting general note:', e);
			error = 'Ошибка загрузки документа: ' + e.message;
		} finally {
			isLoading = false;
		}
	}

	async function handleSave(data: { head: string; body: string }) {
		if (!$currentUser) {
			alert('Ошибка: пользователь не аутентифицирован.');
			return;
		}
		console.log(`Attempting to save general note`);
		try {
			const docRef = doc(db, 'users', $currentUser.uid, 'articles', GENERAL_NOTE_ID);
			await updateDoc(docRef, {
				head: data.head,
				body: data.body
			});
			console.log(`General note saved successfully.`);
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

		if ($currentUser === undefined) {
			isLoading = true;
			error = '';
			return;
		}

		if ($currentUser === null) {
			isLoading = false;
			article = { head: '', body: '' };
			error = 'Пожалуйста, войдите в систему для просмотра заметок.';
			return;
		}

		if ($currentUser && $currentUser.uid) {
			getGeneralNote($currentUser.uid);
		} else {
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
	<Modal title="" bind:open={isEditorOpen} outsideclose={false} size="7xl" permanent={true}>
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