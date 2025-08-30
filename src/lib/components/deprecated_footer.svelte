<script>
	import { Footer, FooterCopyright, FooterLinkGroup, FooterBrand, FooterLink } from "flowbite-svelte";
	import favicon from '$lib/assets/gamepad.ico';
</script>

<Footer footerType="logo">
	<div class="sm:flex sm:items-center sm:justify-between">
		<FooterBrand href="https://flowbite.com" src="{favicon}" alt="PixelJ" name="PixelJ" />
		<FooterLinkGroup class="mb-6 flex flex-wrap items-center text-sm text-gray-500 sm:mb-0 dark:text-gray-400">
			<FooterLink href="/static">About</FooterLink>
			<FooterLink href="/static">Privacy Policy</FooterLink>
			<FooterLink href="/static">Licensing</FooterLink>
			<FooterLink href="/static">Contact</FooterLink>
		</FooterLinkGroup>
	</div>
<!--	<hr class="my-6 border-gray-200 sm:mx-auto lg:my-8 dark:border-gray-700" />-->
<!--	<FooterCopyright href="/" by="Flowbite™" />-->
</Footer>


