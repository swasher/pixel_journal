<script lang="ts">
    import { page } from '$app/stores';
    import MarkdownRenderer from '$lib/components/MarkdownRenderer.svelte';
    import MarkdownEditor from '$lib/components/MarkdownEditor.svelte';
    import { db, user } from '$lib/firebase';
    import { doc, getDoc, setDoc } from 'firebase/firestore';
    import { Button, Modal } from 'flowbite-svelte';
    import { EditSolid } from 'flowbite-svelte-icons';

    let gameId = $page.params.gameId;
    
    let gameTitle = $state('');
    let article = $state({ head: '', body: '' });
    let isLoading = $state(true);
    let error = $state('');
    let isEditorOpen = $state(false);
    let currentUser = $derived(user);

    async function getGameAndNote(uid: string, gameId: string) {
        isLoading = true;
        error = '';
        try {
            // 1. Get Game Data
            const gameRef = doc(db, 'users', uid, 'games', gameId);
            const gameSnap = await getDoc(gameRef);
            if (!gameSnap.exists()) {
                throw new Error('Игра не найдена.');
            }
            const gameData = gameSnap.data();
            gameTitle = gameData.title;

            // 2. Get Note Data
            const noteRef = doc(db, 'users', uid, 'articles', gameId);
            const noteSnap = await getDoc(noteRef);
            if (noteSnap.exists()) {
                const noteData = noteSnap.data();
                article.head = noteData.head || `${gameTitle}`;
                article.body = noteData.body || '';
            } else {
                // Note doesn't exist, start with a default state
                article.head = `${gameTitle}`;
                article.body = 'Нажмите на значок редактирования...';
            }
        } catch (e: any) {
            console.error('Error getting game or note:', e);
            error = 'Ошибка загрузки данных: ' + e.message;
        } finally {
            isLoading = false;
        }
    }

    async function handleSave(data: { head: string; body: string }) {
        if (!$currentUser) {
            alert('Ошибка: пользователь не аутентифицирован.');
            return;
        }
        try {
            const noteRef = doc(db, 'users', $currentUser.uid, 'articles', gameId);
            await setDoc(noteRef, {
                head: data.head,
                body: data.body,
                updatedAt: new Date()
            }, { merge: true }); // Use setDoc with merge to create or update

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
        if ($currentUser && gameId) {
            getGameAndNote($currentUser.uid, gameId);
        }
    });

</script>

<div class="container mx-auto px-4 py-4">
    {#if isLoading}
        <p>Загрузка заметки...</p>
    {:else if error}
        <div class="text-red-500">
            <h1 class="text-2xl font-bold mb-4">Ошибка</h1>
            <p>{error}</p>
        </div>
    {:else}
        <article class="prose dark:prose-invert max-w-prose mx-auto">
            <div class="mb-6 flex w-full items-center justify-between border-b border-gray-700 pb-2">
                <h1 class="text-4xl font-bold text-primary-600 dark:text-secondary-600 m-0 !mb-0">
                    {article.head}
                </h1>
                <Button size="xs" color="alternative" class="p-1" onclick={() => isEditorOpen = true}>
                    <EditSolid class="w-5 w-5" />
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
