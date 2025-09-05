<script>
	import { page } from "$app/state";
	import { Navbar, NavBrand, NavLi, NavUl, NavHamburger, Search, Avatar, Dropdown, DropdownHeader, DropdownGroup, DropdownItem, DropdownDivider } from "flowbite-svelte";
	import favicon from '$lib/assets/gamepad.ico';
	// import avatar from '$lib/assets/avatar.jpg';
	import avatar from '$lib/assets/dummy-avatar.png';
	import { DarkMode } from "flowbite-svelte";
	import { signOut } from 'firebase/auth';
	import { auth, user } from '$lib/firebase'; // Импортируем user store из firebase.ts
    import { userSettings } from '$lib/stores/userSettings';
	import { searchQuery } from '$lib/stores/searchQuery';
	import { isGlobalSearch } from '$lib/stores/searchScope'; // ВОЗВРАЩАЕМ isGlobalSearch

	import { Button } from "flowbite-svelte";
	import { SearchOutline, ChevronDownOutline } from "flowbite-svelte-icons";
	import { Toggle } from "flowbite-svelte";

	let activeUrl = $derived(decodeURIComponent(page.url.pathname));
	let activeClass = "text-orange bg-green-700 md:bg-transparent md:text-green-700 md:dark:text-white lg:dark:bg-orange-500 md:dark:bg-transparent";
	let nonActiveClass = "text-gray-700 hover:bg-gray-100 md:hover:bg-transparent md:border-0 md:hover:text-green-700 dark:text-gray-400 md:dark:hover:text-white dark:hover:bg-gray-700 dark:hover:text-white md:dark:hover:bg-transparent";

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
		<NavUl {activeUrl} classes={{ active: activeClass, nonActive: nonActiveClass }}>
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
			<DropdownItem href="/settings">Settings</DropdownItem>
			<DropdownDivider />
			<DropdownItem onclick={handleSignOut}>Sign out</DropdownItem>
		</DropdownGroup>
	</Dropdown>

</Navbar>