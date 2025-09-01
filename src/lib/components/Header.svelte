<script>
	import { page } from "$app/state";
	import { Navbar, NavBrand, NavLi, NavUl, NavHamburger, Search, Avatar, Dropdown, DropdownHeader, DropdownGroup, DropdownItem, DropdownDivider } from "flowbite-svelte";
	import favicon from '$lib/assets/gamepad.ico';
	// import avatar from '$lib/assets/avatar.jpg';
	import avatar from '$lib/assets/dummy-avatar.png';
	import { DarkMode } from "flowbite-svelte";
	import { signOut } from 'firebase/auth';
	import { auth, user } from '$lib/firebase'; // Импортируем user store из firebase.ts
	import { searchQuery } from '$lib/stores/searchQuery';
	import { isGlobalSearch } from '$lib/stores/searchScope'; // ВОЗВРАЩАЕМ isGlobalSearch

	import { Button } from "flowbite-svelte";
	import { SearchOutline, ChevronDownOutline } from "flowbite-svelte-icons";
	import { Toggle } from "flowbite-svelte";

	let activeUrl = $derived(page.url.pathname);

	const currentUser = $derived(user); // подписка на store в runes mode

	async function handleSignOut() {
		await signOut(auth);
	}
</script>


<Navbar class="fixed z-50 bg-primary-100 dark:bg-secondary-900 py-0" fluid>

	<NavBrand href="/">
		<img src="{favicon}" class="me-3 h-6 sm:h-9" alt="Gamepad Logo" />
		<span class="self-center text-xl font-semibold whitespace-nowrap dark:text-amber-100">Pixel Journal</span>
	</NavBrand>

	<!-- Center Group: Menu and Search -->
	<div class="flex-grow justify-center hidden md:flex items-center space-x-4">
		<NavUl {activeUrl}>
			<NavLi href="/backlog">Backlog</NavLi>
			<NavLi href="/completed">Completed</NavLi>
			<NavLi href="/rejected">Rejected</NavLi>
			<NavLi href="/abandoned">Abandoned</NavLi>
			<NavLi href="/notes">Notes</NavLi>
			<DarkMode size="md" />
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
							color="purple"
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
	<div class="flex items-center md:order-2">
		<div class="flex items-center">
			<Avatar id="avatar-menu" src={avatar} />
		</div>
		<NavHamburger class="md:hidden"/>
	</div>


	<!-- Mobile-only Menu -->
	<div class="md:hidden">
		<NavUl {activeUrl}>
			<NavLi href="/backlog">Backlog</NavLi>
			<NavLi href="/completed">Completed</NavLi>
			<NavLi href="/rejected">Rejected</NavLi>
			<NavLi href="/abandoned">Abandoned</NavLi>
			<NavLi href="/notes">Notes</NavLi>
			<div class="mt-2">
				<form class="flex items-center w-full">
					<div class="relative">
						<Button class="border-primary-700 rounded-e-none border border-e-0 whitespace-nowrap px-3 p-1.5">
							{$isGlobalSearch ? 'All' : 'Current'} <!-- МЕНЯЕМ НА isGlobalSearch -->
							<ChevronDownOutline class="ms-2.5 h-4 w-6" />
						</Button>

						<Dropdown simple class="text-sm">
							<!-- МЕНЯЕМ ЛОГИКУ НА УПРАВЛЕНИЕ isGlobalSearch -->
							<DropdownItem onclick={() => { $isGlobalSearch = true; }} class={!$isGlobalSearch ? "" : "underline"}>
								All
							</DropdownItem>
							<DropdownItem onclick={() => { $isGlobalSearch = false; }} class={!$isGlobalSearch ? "underline" : ""}>
								Current
							</DropdownItem>
						</Dropdown>
					</div>

					<Search clearable size="sm" classes={{ input: "rounded-none py-2 w-full" }} placeholder="Search..." bind:value={$searchQuery} />

					<Button class="rounded-s-none p-2">
						<SearchOutline class="h-4 w-4" />
					</Button>
				</form>
			</div>
			<div class="mt-2">
				<DarkMode size="md" />
			</div>
		</NavUl>
	</div>


	<Dropdown placement="bottom" triggeredBy="#avatar-menu">
		<DropdownHeader>
			<span class="block truncate text-sm font-medium">{$currentUser.email}</span>
		</DropdownHeader>
		<DropdownGroup>
			<DropdownItem href="/settings">Settings</DropdownItem>
			<DropdownDivider />
			<DropdownItem onclick={handleSignOut}>Sign out</DropdownItem>
		</DropdownGroup>
	</Dropdown>

</Navbar>

