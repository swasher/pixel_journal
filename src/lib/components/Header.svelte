<script lang="ts">
	import { page } from "$app/state";
	import {
		Navbar, NavBrand, NavLi, NavUl, NavHamburger, Search, Avatar, Dropdown, DropdownHeader, DropdownGroup,
		DropdownItem, DropdownDivider, Modal, Dropzone, Button, Progressbar, Spinner
	} from "flowbite-svelte";
	import favicon from '$lib/assets/gamepad.ico';
	import avatar from '$lib/assets/dummy-avatar.png';
	import { DarkMode } from "flowbite-svelte";
	import { signOut } from 'firebase/auth';
	import { auth, user, db } from '$lib/firebase'; // Импортируем user store и db из firebase.ts
	import { userSettings } from '$lib/stores/userSettings';
	import { searchQuery } from '$lib/stores/searchQuery';
	import { isGlobalSearch } from '$lib/stores/searchScope';
	import { SearchOutline, ChevronDownOutline } from "flowbite-svelte-icons";
	import { Toggle } from "flowbite-svelte";
	import Papa from 'papaparse';
	import { collection, doc, setDoc, updateDoc, arrayUnion, writeBatch } from 'firebase/firestore';
	import { allGames } from '$lib/stores/allGames';
	import { get } from "svelte/store";

	let activeUrl = $derived(decodeURIComponent(page.url.pathname));
	let activeClass = "text-orange bg-green-700 md:bg-transparent md:text-green-700 md:dark:text-white lg:dark:bg-orange-500 md:dark:bg-transparent";
	let nonActiveClass = "text-gray-700 hover:bg-gray-100 md:hover:bg-transparent md:border-0 md:hover:text-green-700 dark:text-gray-400 md:dark:hover:text-white dark:hover:bg-gray-700 dark:hover:text-white md:dark:hover:bg-transparent";

	const currentUser = $derived(user); // подписка на store в runes mode для UI
	let isImportModalOpen = $state(false);
	let filesInDropzone = $state<FileList | null>(null);

	let isImporting = $state(false);
	let importProgress = $state(0);
	let totalGamesToImport = $state(0);
	let importMessage = $state('');

	function handleOnChange(event: Event) {
		const target = event.target as HTMLInputElement;
		filesInDropzone = target.files;
	}

	function handleOnDrop(event: DragEvent) {
		event.preventDefault();
		filesInDropzone = event.dataTransfer?.files ?? null;
	}

	function showFiles(files: FileList | null): string {
		if (!files || files.length === 0) return "No files selected.";
		return Array.from(files).map((file) => file.name).join(", ");
	}

	function clearFiles(event: Event) {
		event.stopPropagation();
		filesInDropzone = null;
	}

	async function handleSignOut() {
		await signOut(auth);
	}

	function getSlugFromUrl(url: string): string | null {
		try {
			const path = new URL(url).pathname;
			const parts = path.split('/').filter(p => p);
			if (parts.length > 0 && parts[0] === 'games') {
				return parts[1];
			}
			return null;
		} catch (e) {
			return null;
		}
	}

	function getRatingMapping(rating: string): { stars: number, isFavorite: boolean } {
		switch (rating?.toLowerCase()) {
			case 'exceptional': return { stars: 5, isFavorite: true };
			case 'recommended': return { stars: 4, isFavorite: false };
			case 'meh': return { stars: 3, isFavorite: false };
			case 'skip': return { stars: 1, isFavorite: false };
			default: return { stars: 0, isFavorite: false };
		}
	}

	async function handleImport() {
		const currentUser = get(user);
		if (!filesInDropzone || filesInDropzone.length === 0 || !currentUser) {
			importMessage = 'Error: User not logged in or no file selected.';
			return;
		}

		isImporting = true;
		importProgress = 0;
		importMessage = 'Starting import...';

		const file = filesInDropzone[0];
		const fileContent = await file.text();

		Papa.parse(fileContent, {
			header: true,
			skipEmptyLines: true,
			complete: async (results) => {
				const gamesFromCsv = results.data as any[];
				totalGamesToImport = gamesFromCsv.length;
				const batch = writeBatch(db);
				const newCategories = new Set<string>();
				const newTags = new Set<string>();

				for (const [index, row] of gamesFromCsv.entries()) {
					const slug = getSlugFromUrl(row.Url);
					if (!slug) {
						console.warn('Skipping row, invalid URL:', row.Url);
						importProgress = index + 1;
						continue;
					}

					importMessage = `[${index + 1}/${totalGamesToImport}] Searching for: ${row.Game}`;

					// 1. Search game by slug to get its ID
					const searchResponse = await fetch(`/api/search-game?q=${encodeURIComponent(slug)}`);
					if (!searchResponse.ok) {
						console.warn(`Could not find game with slug: ${slug}. Skipping.`);
						importProgress = index + 1;
						continue;
					}
					const searchResults = await searchResponse.json();
					const gameFromSearch = searchResults[0];

					if (!gameFromSearch || !gameFromSearch.id) {
						console.warn(`No precise match for slug: ${slug}. Skipping.`);
						importProgress = index + 1;
						continue;
					}

					// Check for duplicates
					if ($allGames.some(g => g.rawg_id === gameFromSearch.id)) {
						console.log(`Game "${gameFromSearch.title}" already in library. Skipping.`);
						importProgress = index + 1;
						continue;
					}

					// 2. Get detailed game info
					importMessage = `[${index + 1}/${totalGamesToImport}] Getting details for: ${gameFromSearch.title}`;
					const detailsResponse = await fetch(`/api/game-details?id=${gameFromSearch.id}`);
					const gameDetails = detailsResponse.ok ? await detailsResponse.json() : {};

					// 3. Map data
					const { stars, isFavorite } = getRatingMapping(row.Rating);
					const gameTags = row.Rating ? [row.Rating] : [];

					const newGame = {
						userId: currentUser.uid,
						rawg_id: gameFromSearch.id,
						title: gameFromSearch.title,
						year: gameFromSearch.year,
						image_url: gameFromSearch.image_url,
						genres: gameFromSearch.genres || [],
						developer: gameDetails.developer || [],
						publisher: gameDetails.publisher || [],
						series: gameDetails.series || '',
						status: row.Status || 'backlog',
						date_added: new Date(row.Created),
						user_rating: stars,
						is_favorite: isFavorite,
						user_note: row.Review || '',
						play_time: 0,
						markdown_content: '',
						tags: gameTags
					};

					// 4. Add to batch
					const gameRef = doc(collection(db, 'users', currentUser.uid, 'games'));
					batch.set(gameRef, newGame);

					// 5. Collect new categories and tags
					if (row.Status && !$userSettings.categories.includes(row.Status)) {
						newCategories.add(row.Status);
					}
					if (row.Rating && !$userSettings.tags.includes(row.Rating)) {
						newTags.add(row.Rating);
					}
					
					importProgress = index + 1;
				}

				// 6. Update user settings if needed
				if (newCategories.size > 0 || newTags.size > 0) {
					importMessage = 'Updating your categories and tags...';
					const settingsRef = doc(db, 'users', currentUser.uid);
					await updateDoc(settingsRef, {
						categories: arrayUnion(...Array.from(newCategories)),
						tags: arrayUnion(...Array.from(newTags))
					});
				}

				// 7. Commit batch
				importMessage = 'Saving games to your library...';
				await batch.commit();

				importMessage = 'Import complete!';
				isImporting = false;
				setTimeout(() => {
					isImportModalOpen = false;
					filesInDropzone = null;
				}, 2000);
			},
			error: (error) => {
				console.error("CSV parsing error:", error);
				importMessage = `Error parsing CSV: ${error.message}`;
				isImporting = false;
			}
		});
	}

</script>


<Navbar class="fixed z-50 bg-primary-100 dark:bg-secondary-900 py-0" fluid>

	<NavBrand href="/">
		<img src="{favicon}" class="me-3 h-6 sm:h-9" alt="Gamepad Logo" />
		<span class="self-center text-xl font-semibold whitespace-nowrap dark:text-amber-100">Pixel Journal</span>
	</NavBrand>

	<!-- Center Group: Menu and Search -->
	<div class="flex-grow justify-center hidden md:flex items-center space-x-4">
		<NavUl {activeUrl} classes={{ active: activeClass, nonActive: nonActiveClass }}>
			{#each $userSettings.categories as category (category)}
				<NavLi href="/{category}">{category}</NavLi>
			{/each}

		</NavUl>

		<!-- Поисковая строка с переключателем -->
		<div class="flex items-center pl-10 md:order-2 w-full md:w-auto">
			<div class="relative w-full max-w-xs">
				<Search
					size="md"
					placeholder="Поиск..."
					classes={{ input: "rounded-lg pr-20 pl-10" }}
					bind:value={$searchQuery}
				>
					<!-- Переключатель внутри поля ввода -->
					<div class="absolute right-3 top-1/2 transform -translate-y-1/2 ">
						<Toggle
							size="small"
							color="orange"
							checked={$isGlobalSearch}
							onchange={() => ($isGlobalSearch = !$isGlobalSearch)}
						>
							{#snippet offLabel()}Page{/snippet}
							All
						</Toggle>
					</div>
				</Search>
			</div>
		</div>


	</div>


	<!-- Right Group: Avatar and other controls -->
	<div class="flex items-center md:order-2 space-x-3 rtl:space-x-reverse">
		<NavUl class="mr-0" {activeUrl} classes={{ active: activeClass, nonActive: nonActiveClass }}>
			<NavLi href="/notes">Notes</NavLi>
		</NavUl>

		<DarkMode size="lg" class="mr-5"/>

		<div class="flex items-center">
			<Avatar id="avatar-menu" src={$currentUser?.photoURL || avatar} />
		</div>
		<NavHamburger class="md:hidden"/>
	</div>


	<!-- Mobile-only Menu -->
	<div class="md:hidden">
		<NavUl {activeUrl}  classes={{ active: activeClass, nonActive: nonActiveClass }}>
			{#each $userSettings.categories as category (category)}
				<NavLi href="/{category}">{category}</NavLi>
			{/each}
			<NavLi href="/notes">Notes</NavLi>
			<div class="mt-2">
				<!-- Поисковая строка с переключателем -->
				<div class="flex items-center pl-10 md:order-2 w-full md:w-auto">
					<div class="relative w-full max-w-xs">
						<Search
							size="md"
							placeholder="Поиск..."
							classes={{ input: "rounded-lg pr-20 pl-10" }}
							bind:value={$searchQuery}
						>
							<!-- Переключатель внутри поля ввода -->
							<div class="absolute right-3 top-1/2 transform -translate-y-1/2 ">
								<Toggle
									size="small"
									color="orange"
									checked={$isGlobalSearch}
									onchange={() => ($isGlobalSearch = !$isGlobalSearch)}
								>
									{#snippet offLabel()}Page{/snippet}
									All
								</Toggle>
							</div>
						</Search>
					</div>
				</div>

			</div>

		</NavUl>
	</div>


	<Dropdown placement="bottom" triggeredBy="#avatar-menu">
		<DropdownHeader>
			<span class="block truncate text-sm font-medium">{$currentUser.email}</span>
		</DropdownHeader>
		<DropdownGroup>
			<!-- Такой хитрый класс нужен, иначе будет баг с подсветкой пунктов меню при hover мыши		-->
			<DropdownItem class="block w-full text-left px-4 py-2" onclick={() => isImportModalOpen = true}>Import Rawg.io CSV</DropdownItem>
			<DropdownItem href="/settings">Settings</DropdownItem>
			<DropdownDivider />
			<DropdownItem class="block w-full text-left px-4 py-2" onclick={handleSignOut}>Sign out</DropdownItem>
		</DropdownGroup>
	</Dropdown>

</Navbar>

<Modal title="Import Games from RAWG" bind:open={isImportModalOpen} size="md" onclose={() => { if (!isImporting) filesInDropzone = null; }}>
	{#if !isImporting}
		<Dropzone id="my-awesome-dropzone" bind:files={filesInDropzone} onchange={handleOnChange} ondrop={handleOnDrop}>
			<svg aria-hidden="true" class="mb-3 h-10 w-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
			</svg>

			{#if !filesInDropzone || filesInDropzone.length === 0}
				<p class="mb-2 text-sm text-gray-500 dark:text-gray-400">
					<span class="font-semibold">Click to upload</span>
					or drag and drop
				</p>
				<p class="text-xs text-gray-500 dark:text-gray-400">CSV file from RAWG.io</p>
			{:else}
				<p class="text-sm text-green-600">{showFiles(filesInDropzone)}</p>
				<button class="mt-2 text-sm text-red-500 hover:underline" onclick={clearFiles}>Clear Files</button>
			{/if}
		</Dropzone>
		<div class="flex justify-end pt-4">
			<Button
				color="alternative"
				onclick={() => { isImportModalOpen = false; filesInDropzone = null; }}
			>
				Cancel
			</Button>
			<Button
				class="ml-2"
				disabled={!filesInDropzone || filesInDropzone.length === 0}
				onclick={handleImport}
			>
				Import
			</Button>
		</div>
	{:else}
		<div class="flex flex-col items-center justify-center p-4">
			<Spinner size={8} />
			<p class="mt-4 text-lg">Importing games...</p>
			<p class="text-sm text-gray-500 dark:text-gray-400">{importMessage}</p>
			{#if totalGamesToImport > 0}
				<div class="w-full mt-4">
					<Progressbar progress={((importProgress / totalGamesToImport) * 100).toFixed(0)} />
					<p class="text-center text-sm mt-1">{importProgress} / {totalGamesToImport}</p>
				</div>
			{/if}
		</div>
	{/if}
</Modal>
