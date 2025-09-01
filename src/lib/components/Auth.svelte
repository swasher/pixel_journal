<script lang="ts">
    import { auth, googleProvider } from '$lib/firebase';
    import { signInWithPopup } from 'firebase/auth';
    import { Button } from 'flowbite-svelte';
    import { GoogleSolid } from 'flowbite-svelte-icons';

    let error = $state<string | null>(null);
    let isLoading = $state(false);

    async function signInWithGoogle() {
        isLoading = true;
        error = null;
        try {
            await signInWithPopup(auth, googleProvider);
            // The onAuthStateChanged listener in firebase.ts will handle the user state update
            // and the UI will reactively update.
        } catch (e: any) {
            error = e.message;
            console.error("Google sign-in error:", e);
        } finally {
            isLoading = false;
        }
    }
</script>

<div class="flex flex-col items-center justify-center p-4">
    <h1 class="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Welcome to Pixel Journal</h1>
    <p class="text-gray-600 dark:text-gray-400 mb-6">Sign in to manage your game library.</p>
    
    <Button 
        onclick={signInWithGoogle} 
        disabled={isLoading}
        class="w-full max-w-xs"
    >
        <GoogleSolid class="w-5 h-5 me-2" />
        {#if isLoading}
            Signing in...
        {:else}
            Sign in with Google
        {/if}
    </Button>

    {#if error}
        <p class="mt-4 text-sm text-red-600 dark:text-red-500">{error}</p>
    {/if}
</div>