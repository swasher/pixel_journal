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
	<div class="prose dark:prose-invert scrollbar-thin overflow-y-auto max-h-[77vh]">
		{@html html}
	</div>
{:else}
	<p>Загрузка...</p>
{/if}
