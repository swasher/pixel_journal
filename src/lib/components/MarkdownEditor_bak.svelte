<script lang="ts">
	import { marked } from 'marked';
	import DOMPurify from 'dompurify';
	import { Button, Checkbox, Label } from 'flowbite-svelte';

	// --- PROPS ---
	let { head = '', body = '', onSave, onCancel } = $props<{ 
		head: string;
		body: string;
		onSave: (data: { head: string; body: string }) => void;
		onCancel: () => void;
	}>();

	// --- LOCAL STATE ---
	let editedHead = $state(head);
	let editedBody = $state(body);
	let showPreview = $state(false);

	// --- MARKED OPTIONS ---
	let gfm = $state(true);
	let breaks = $state(true);

	// --- DERIVED PREVIEW ---
	let rendered = $derived(
		DOMPurify.sanitize(marked.parse(editedBody, { gfm, breaks }), { USE_PROFILES: { html: true } })
	);

	function handleSave() {
		onSave({ head: editedHead, body: editedBody });
	}

	function toggleTab() {
		showPreview = !showPreview;
	}
</script>

<div class="flex h-full flex-col ">
	<!-- Header -->
	<div class="border-b border-gray-700 bg-gray-800 p-2 text-sm text-gray-300">
		<input
			type="text"
			bind:value={editedHead}
			placeholder="Заголовок заметки"
			class="w-full border-none bg-transparent text-lg text-white focus:ring-0"
		/>
	</div>

	<!-- Toolbar -->
	<div class="flex items-center gap-4 bg-gray-800/50 px-3 py-2">
		<button
			type="button"
			class="cursor-pointer rounded-md px-3 py-1 {showPreview ? '' : 'bg-gray-700 text-white'}"
			onclick={() => (showPreview = false)}>
			Редактор
		</button>
		<button
			type="button"
			class="cursor-pointer rounded-md px-3 py-1 {showPreview ? 'bg-gray-700 text-white' : ''}"
			onclick={() => (showPreview = true)}>
			Предпросмотр
		</button>
		<div class="flex items-center gap-2">
			<Checkbox bind:checked={gfm}>GFM</Checkbox>
			<Checkbox bind:checked={breaks}>Переносы</Checkbox>
		</div>
		<div class="ml-auto flex items-center gap-2">
			<Button size="xs" color="alternative" onclick={onCancel}>Отмена</Button>
			<Button size="xs" color="blue" onclick={handleSave}>Сохранить</Button>
		</div>
	</div>

	<!-- Editor/Preview Pane -->
	<div class="flex-1 overflow-y-auto ">
		{#if !showPreview}
			<textarea
				bind:value={editedBody}
				placeholder="# Заголовок\n\nНаберите Markdown…"
				class="h-full w-full resize-none border-0 bg-gray-900 p-4 text-gray-200 outline-none focus:ring-0"
				onkeydown={(e) => {
					if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') toggleTab();
				}}></textarea>
		{:else}
			<div class="prose dark:prose-invert h-full max-w-none p-4">
				{@html rendered}
			</div>
		{/if}
	</div>
</div>