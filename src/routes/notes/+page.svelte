<script lang="ts">
	import MarkdownRenderer from '$lib/components/MarkdownRenderer.svelte';
	import MarkdownEditor from '$lib/components/MarkdownEditor.svelte';
	import { db } from '$lib/firebase';
	import { doc, getDoc, updateDoc } from 'firebase/firestore';
	import { Button, Modal } from 'flowbite-svelte';
	import { EditSolid } from 'flowbite-svelte-icons';

	let article = $state({ head: '', body: '' });
	let isLoading = $state(true);
	let error = $state('');
	let isEditorOpen = $state(false);

	async function getArticle() {
		try {
			const docRef = doc(db, 'articles', 'main');
			const docSnap = await getDoc(docRef);

			if (docSnap.exists()) {
				const data = docSnap.data();
				article.head = data.head || 'Заголовок не найден';
				article.body = data.body || 'Содержимое не найдено.';
			} else {
				throw new Error('Документ с заметками не найден в базе данных.');
			}
		} catch (e: any) {
			error = e.message;
		} finally {
			isLoading = false;
		}
	}

	async function handleSave(data: { head: string; body: string }) {
		try {
			const docRef = doc(db, 'articles', 'main');
			await updateDoc(docRef, {
				head: data.head,
				body: data.body
			});
			// Update local state to reflect changes immediately
			article.head = data.head;
			article.body = data.body;
		} catch (e: any) {
			// TODO: Show a proper error to the user
			console.error('Error saving article: ', e);
			alert('Ошибка сохранения: ' + e.message);
		} finally {
			isEditorOpen = false;
		}
	}

	getArticle();
</script>

<div class="container mx-auto px-4 py-8">
	{#if isLoading}
		<p>Загрузка заметок...</p>
	{:else if error}
		<div class="text-red-500">
			<h1 class="text-2xl font-bold mb-4">Ошибка при загрузке</h1>
			<p>{error}</p>
		</div>
	{:else}
		<article class="prose dark:prose-invert max-w-none">
			<div class="mb-6 flex w-full items-center justify-between border-b border-gray-700 pb-2">
				<h1 class="text-4xl font-bold text-primary-600 dark:text-primary-400">
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