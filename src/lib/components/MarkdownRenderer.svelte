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



------------ Вариант Grok



<div class="flex items-center w-full max-w-md mx-auto">
	<div class="relative w-full flex items-center">
		<!-- Поисковая строка -->
		<Search
			size="lg"
			placeholder="Поиск..."
			classes={{ input: "rounded-lg pr-20 pl-10" }}
		>
			<!-- Иконка поиска -->
			<SearchOutline class="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-500" />
			<!-- Переключатель внутри поля ввода -->
			<div class="absolute right-3 top-1/2 transform -translate-y-1/2">
				<Toggle size="small" color="purple" checked={false}>
					{#snippet offLabel()}Нет{/snippet}
					Да
				</Toggle>
			</div>
		</Search>
	</div>
</div>

<style>
    /* Дополнительные стили для тонкой настройки, если нужно */
    :global(.flowbite-toggle) {
        /* Уменьшаем размер переключателя для гармоничного встраивания */
        transform: scale(0.8);
    }
</style>