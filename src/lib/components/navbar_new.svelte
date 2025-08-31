<script>
	import { page } from "$app/state";
	import { Navbar, NavBrand, NavLi, NavUl, NavHamburger, Search, Avatar, Dropdown, DropdownHeader, DropdownGroup, DropdownItem, DropdownDivider, Checkbox } from "flowbite-svelte";
	import favicon from '$lib/assets/gamepad.ico';
	// import avatar from '$lib/assets/avatar.jpg';
	import avatar from '$lib/assets/dummy-avatar.png';
	import { DarkMode } from "flowbite-svelte";
	import { signOut } from 'firebase/auth';
	import { auth, user } from '$lib/firebase'; // Импортируем user store из firebase.ts
	import { searchQuery } from '$lib/stores/searchQuery';
	import { isGlobalSearch } from '$lib/stores/searchScope';

	import { Button } from "flowbite-svelte";
	import { SearchOutline, ChevronDownOutline } from "flowbite-svelte-icons";


	const items = [
		{
			label: "All"
		},
		{
			label: "Current"
		}
	];
	let selectCategory = $state("All");


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

<div class="">
		<form class="flex items-center ms-auto">
			<div class="relative">
				<Button class="border-primary-700 rounded-e-none border border-e-0 whitespace-nowrap px-3 p-1.5">
					{selectCategory}
					<ChevronDownOutline class="ms-2.5 h-4 w-6" />
				</Button>

				<Dropdown  simple class="text-sm">
					{#each items as { label } (label)}
						<DropdownItem
							onclick={() => {
            selectCategory = label;
          }}
							class={selectCategory === label ? "underline" : ""}
						>
							{label}
						</DropdownItem>
					{/each}
				</Dropdown>
			</div>

			<Search size="sm" classes={{ input: "rounded-none py-2" }} placeholder="Search in your games..." />

			<Button class="rounded-s-none p-2">
				<SearchOutline  class="h-4 w-4" />
			</Button>
		</form>
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
			<div class="mt-2 flex items-center space-x-2">
				<Search size="sm" placeholder="Search..." bind:value={$searchQuery} />
				<Checkbox bind:checked={$isGlobalSearch}>All</Checkbox>
			</div>
			<DarkMode size="md" />
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