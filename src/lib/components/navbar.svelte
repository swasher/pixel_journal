<script>
	import { page } from "$app/state";
	import { Navbar, NavBrand, NavLi, NavUl, NavHamburger, Search, Avatar, Dropdown, DropdownHeader, DropdownGroup, DropdownItem } from "flowbite-svelte";
	import { SearchOutline } from "flowbite-svelte-icons";
	import favicon from '$lib/assets/gamepad.ico';
	import avatar from '$lib/assets/avatar.jpg';
	import { DarkMode } from "flowbite-svelte";
	import { onAuthStateChanged, signOut } from 'firebase/auth';
	import { auth } from '$lib/firebase';
	import { userStore } from '$lib/stores/user';
	import { goto } from "$app/navigation";

	let activeUrl = $derived(page.url.pathname);

	onAuthStateChanged(auth, (authUser) => {
		userStore.set(authUser);
	});

	const user = $derived(userStore); // подписка на store в runes mode

	async function handleSignOut() {
		await signOut(auth);
		userStore.set(null);
		await goto('/');
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
			<span class="block truncate text-sm font-medium">{$user.email}</span>
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