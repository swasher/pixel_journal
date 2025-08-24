<script>
	import { page } from "$app/state";
	import { Navbar, NavBrand, NavLi, NavUl, NavHamburger, Search, Avatar, Dropdown, DropdownHeader, DropdownGroup, DropdownItem } from "flowbite-svelte";
	import { SearchOutline } from "flowbite-svelte-icons";
	import favicon from '$lib/assets/gamepad.ico';
	import avatar from '$lib/assets/avatar.jpg';
	import { DarkMode } from "flowbite-svelte";
	import { signOut } from 'firebase/auth';
	import { auth, user } from '$lib/firebase'; // Импортируем user store из firebase.ts

	let activeUrl = $derived(page.url.pathname);

	const currentUser = $derived(user); // подписка на store в runes mode

	async function handleSignOut() {
		await signOut(auth);
	}
</script>


<Navbar class="bg-primary-100 dark:bg-secondary-900">

	<NavBrand href="/">
		<img src="{favicon}" class="me-3 h-6 sm:h-9" alt="Gamepad Logo" />
		<span class="self-center text-xl font-semibold whitespace-nowrap dark:text-white">Pixel Journal</span>
	</NavBrand>


	<div class="flex items-center md:order-3">
		<Avatar id="avatar-menu" src={avatar} />
	</div>

	<Dropdown placement="bottom" triggeredBy="#avatar-menu">
		<DropdownHeader>
<!--			<span class="block text-sm">USER NAME</span>-->
			<span class="block truncate text-sm font-medium">{currentUser.email}</span>
		</DropdownHeader>
		<DropdownGroup>
			<DropdownItem>Dashboard</DropdownItem>
			<DropdownItem>Settings</DropdownItem>
			<DropdownItem>Earnings</DropdownItem>
		</DropdownGroup>
		<DropdownItem onclick={handleSignOut}>Sign out</DropdownItem>
	</Dropdown>


	<div class="flex md:order-2">
		<div class="hidden md:block">
			<Search size="md" class="ms-auto" placeholder="Search..." />
		</div>
	</div>

	<NavHamburger />
	<NavUl {activeUrl}>
		<NavLi href="/">Home</NavLi>
		<NavLi href="/backlog">Backlog</NavLi>
		<NavLi href="/completed">Completed</NavLi>
		<NavLi href="/rejected">Rejected</NavLi>
		<NavLi href="/abandoned">Abandoned</NavLi>
		<DarkMode />
	</NavUl>

</Navbar>