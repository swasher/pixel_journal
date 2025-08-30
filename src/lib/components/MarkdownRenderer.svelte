<script lang="ts">
	import { marked } from 'marked';
	import DOMPurify from 'dompurify';

	

	// Пропс 'text' - это строка markdown из Firebase
	let { text = '' } = $props();

	let html = $derived(DOMPurify.sanitize(marked.parse(text)));

	marked.setOptions({ breaks: true }); // Переносы строк становятся <br>
</script>

{#if html}
	<!--
    Оборачиваем в div с классом `markdown-body`.
    Стили для темной темы применяются автоматически через app.css
    благодаря классу .dark на теге <html>
    -->
<!--	<div class="markdown-body">-->
	<div class="prose dark:prose-invert
scrollbar-thin

  overflow-y-auto max-h-[76vh]">

scrollbar-thumb-gray-700 dark:scrollbar-thumb-gray-400 scrollbar-track-gray-300 dark:scrollbar-track-gray-800 overflow-y-auto max-h-[80vh]">
		{@html html}
	</div>
{:else}
	<p>Загрузка...</p>
{/if}
