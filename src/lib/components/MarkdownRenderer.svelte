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


	<!-- ПРИМЕНЕНИЕ СТИЛЕЙ TAILWIND TIPOGRAPHY	-->
<!--	<div class="prose dark:prose-invert scrollbar-thin overflow-y-auto max-h-[77vh]">-->
<!--		{@html html}-->
<!--	</div>-->

	<!-- ПРИМЕНЕНИЕ СТИЛЕЙ GITHUB -->
	<div class="markdown-body dark:markdown-body-dark scrollbar-thin overflow-y-auto max-h-[77vh] p-3">
		{@html html}
	</div>


{:else}
	<p>Загрузка...</p>
{/if}

<style>
    :global(.markdown-body table),
    :global(.markdown-body th),
    :global(.markdown-body td) {
        background-color: white !important;
        color: #1f2937 !important; /* text-gray-900 */
        border-color: #d1d5db !important; /* border-gray-300 */
    }

    :global(.dark .markdown-body table),
    :global(.dark .markdown-body th),
    :global(.dark .markdown-body td) {
        background-color: #1f2937 !important; /* bg-gray-800 */
        color: white !important;
        border-color: #4b5563 !important; /* border-gray-600 */
    }
</style>
