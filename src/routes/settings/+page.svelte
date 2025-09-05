<script lang="ts">
    import { Heading, Label, Tags, Button, Spinner, Table, TableHead, TableHeadCell, TableBody, TableBodyRow, TableBodyCell, Input, P } from 'flowbite-svelte';
    import { user, db, updateGameStatuses, deleteUserGames, auth } from '$lib/firebase';
    import { userSettings } from '$lib/stores/userSettings';
    import { doc, setDoc, arrayUnion, updateDoc, arrayRemove, deleteDoc, query, collection, where, getDocs, writeBatch } from 'firebase/firestore';
    import { deleteUser, GoogleAuthProvider, reauthenticateWithPopup } from 'firebase/auth';
    import { goto } from '$app/navigation';
    import { PenOutline, TrashBinOutline } from 'flowbite-svelte-icons';
    import DeleteConfirmationModal from '$lib/components/DeleteConfirmationModal.svelte';
    import RenameModal from '$lib/components/RenameModal.svelte';
    import DestructiveConfirmationModal from '$lib/components/DestructiveConfirmationModal.svelte';

    let newCategory = $state('');
    let isLoading = $state(false);
    const currentUser = $derived(user);

    let isDeleteModalOpen = $state(false);
    let categoryToDelete = $state<string | null>(null);

    let isRenameModalOpen = $state(false);
    let categoryToRename = $state<string | null>(null);

    let isDeleteAccountModalOpen = $state(false);
    let deleteError = $state<string | null>(null);

    // Tags are also part of the userSettings store, but the Tags component needs a writable variable.
    // This effect syncs the store value to a local state variable.
    let userTags = $state<string[]>([]);
    $effect(() => {
        userTags = $userSettings.tags;
    });

    async function saveTags() {
        if (!$currentUser) {
            alert('You must be logged in to save settings.');
            return;
        }
        isLoading = true;
        try {
            const userSettingsRef = doc(db, 'user_settings', $currentUser.uid);
            await setDoc(userSettingsRef, { tags: userTags }, { merge: true });
        } catch (error) {
            console.error("Error saving tags: ", error);
        } finally {
            isLoading = false;
        }
    }

    async function addCategory() {
        if (!newCategory.trim()) return;
        if (!$currentUser) return;

        if ($userSettings.categories.includes(newCategory.trim())) {
            alert('This category already exists.');
            return;
        }

        const categoryToAdd = newCategory.trim();
        isLoading = true;
        try {
            const userSettingsRef = doc(db, 'user_settings', $currentUser.uid);
            await updateDoc(userSettingsRef, { 
                categories: arrayUnion(categoryToAdd)
            });
            newCategory = '';
        } catch (error) {
            console.error("Error adding category: ", error);
        } finally {
            isLoading = false;
        }
    }

    function openDeleteModal(category: string) {
        categoryToDelete = category;
        isDeleteModalOpen = true;
    }

    async function confirmDelete() {
        if (!categoryToDelete || !$currentUser) return;

        isLoading = true;
        try {
            const userSettingsRef = doc(db, 'user_settings', $currentUser.uid);
            await updateDoc(userSettingsRef, {
                categories: arrayRemove(categoryToDelete)
            });
            isDeleteModalOpen = false;
            categoryToDelete = null;
        } catch (error) {
            console.error("Error deleting category: ", error);
        } finally {
            isLoading = false;
        }
    }

    function openRenameModal(category: string) {
        categoryToRename = category;
        isRenameModalOpen = true;
    }

    async function handleRename(event: CustomEvent<string>) {
        const newName = event.detail;
        if (!categoryToRename || !$currentUser || !newName || newName === categoryToRename) {
            isRenameModalOpen = false;
            return;
        }

        if ($userSettings.categories.includes(newName)) {
            alert('This category already exists.');
            return;
        }

        isLoading = true;
        try {
            await updateGameStatuses($currentUser.uid, categoryToRename, newName);

            const newCategories = $userSettings.categories.map(c => (c === categoryToRename ? newName : c));
            const userSettingsRef = doc(db, 'user_settings', $currentUser.uid);
            await updateDoc(userSettingsRef, { categories: newCategories });

            isRenameModalOpen = false;
            categoryToRename = null;
        } catch (error) {
            console.error("Error renaming category and updating games: ", error);
        } finally {
            isLoading = false;
        }
    }

    function openDeleteAccountModal() {
        deleteError = null; // Clear previous errors on open
        isDeleteAccountModalOpen = true;
    }

    async function handleDeleteAccount() {
        if (!$currentUser) return;

        isLoading = true;
        deleteError = null;
        const userId = $currentUser.uid;

        // The core cleanup logic
        const cleanupUserData = async () => {
            console.log(`Starting data cleanup for user: ${userId}`);

            // 1. Delete all games
            await deleteUserGames(userId);

            // 2. Delete all notes (Articles)
            console.log(`Starting deletion of all notes for user: ${userId}`);
            const notesQuery = query(collection(db, "Articles"), where("userId", "==", userId));
            const notesSnapshot = await getDocs(notesQuery);
            if (!notesSnapshot.empty) {
                const notesBatch = writeBatch(db);
                notesSnapshot.forEach(doc => notesBatch.delete(doc.ref));
                await notesBatch.commit();
                console.log(`Deleted ${notesSnapshot.size} notes.`);
            } else {
                console.log('No notes found to delete.');
            }

            // 3. Delete user settings document
            console.log(`Starting deletion of user settings for user: ${userId}`);
            const userSettingsRef = doc(db, 'user_settings', userId);
            await deleteDoc(userSettingsRef);

            console.log('User data cleanup complete.');
        };

        try {
            // Step 1: Clean up all user data from Firestore
            await cleanupUserData();

            // Step 2: Delete the user account from Firebase Auth
            await deleteUser($currentUser);
            
            console.log('User account deleted successfully.');
            isDeleteAccountModalOpen = false;
            await goto('/');

        } catch (error: any) {
            if (error.code === 'auth/requires-recent-login') {
                console.log('Requires recent login. Triggering re-auth popup.');
                try {
                    // This assumes the user signed in with Google.
                    const provider = new GoogleAuthProvider();
                    await reauthenticateWithPopup($currentUser, provider);
                    
                    // Retry the entire process after successful re-authentication
                    console.log('Re-authentication successful. Retrying cleanup and deletion...');
                    await cleanupUserData();
                    await deleteUser($currentUser);

                    console.log('User account deleted successfully after re-auth.');
                    isDeleteAccountModalOpen = false;
                    await goto('/');

                } catch (reauthError: any) {
                    console.error('Re-authentication failed:', reauthError);
                    deleteError = 'Re-authentication failed. Please log out and log back in to delete your account.';
                    isDeleteAccountModalOpen = false; // Close the modal to show the error
                }
            } else {
                console.error('Error deleting account:', error);
                deleteError = 'An error occurred while deleting your account. Please try again.';
                isDeleteAccountModalOpen = false; // Close the modal to show the error
            }
        } finally {
            isLoading = false;
        }
    }

</script>

<div class="container mx-auto p-4 max-w-2xl">
    <Heading tag="h1" class="mb-6">Settings</Heading>

    {#if $currentUser === undefined}
        <div class="flex justify-center items-center py-10">
            <Spinner size="8" />
        </div>
    {:else}
        <div class="space-y-8">
            <!-- Tags Section -->
            <div>
                <Label for="user-tags" class="block mb-2 text-lg font-semibold">Your Custom Tags</Label>
                <p class="text-sm text-gray-500 dark:text-gray-400 mb-3">
                    Add or remove tags that you can later assign to your games. Press Enter to add a tag.
                </p>
                <Tags id="user-tags" bind:value={userTags} unique={true} placeholder="Add a new tag..." />
                <div class="flex justify-end border-t dark:border-gray-700 pt-4 mt-4">
                    <Button onclick={saveTags} disabled={isLoading}>Save Tags</Button>
                </div>
            </div>

            <!-- Categories Section -->
            <div>
                <Label class="block mb-2 text-lg font-semibold">Your Custom Categories</Label>
                <p class="text-sm text-gray-500 dark:text-gray-400 mb-3">
                    Manage the categories for your game lists.
                </p>
                
                <div class="border dark:border-gray-700 rounded-lg mb-4">
                    <Table>
                        <TableHead>
                            <TableHeadCell>Category Name</TableHeadCell>
                            <TableHeadCell class="text-right">Actions</TableHeadCell>
                        </TableHead>
                        <TableBody>
                            {#each $userSettings.categories as category (category)}
                                <TableBodyRow>
                                    <TableBodyCell class="font-medium">{category}</TableBodyCell>
                                    <TableBodyCell class="text-right space-x-2">
                                        <Button size="xs" color="alternative" onclick={() => openRenameModal(category)}> <PenOutline class="w-4 h-4 me-1"/> Rename</Button>
                                        <Button size="xs" color="red" onclick={() => openDeleteModal(category)}> <TrashBinOutline class="w-4 h-4 me-1"/> Delete</Button>
                                    </TableBodyCell>
                                </TableBodyRow>
                            {/each}
                             {#if $userSettings.categories.length === 0}
                                <TableBodyRow>
                                    <TableBodyCell colspan="2" class="text-center text-gray-500">
                                        No categories added yet.
                                    </TableBodyCell>
                                </TableBodyRow>
                            {/if}
                        </TableBody>
                    </Table>
                </div>

                <form onsubmit={addCategory} class="flex items-center gap-2">
                    <Input type="text" bind:value={newCategory} placeholder="Enter new category name" class="flex-grow" required />
                    <Button type="submit" class="w-40" disabled={isLoading}>Add Category</Button>
                </form>
            </div>

            <!-- Danger Zone -->
            <div class="border-t-2 border-red-500 pt-6 mt-8">
                <Heading tag="h2" class="text-xl font-bold text-red-600 dark:text-red-500 mb-2">Danger Zone</Heading>
                <P class="text-gray-600 dark:text-gray-400 mb-4">
                    This action is irreversible. All your games, categories, and tags will be permanently deleted.
                </P>
                <Button color="red" onclick={openDeleteAccountModal} disabled={isLoading}>
                    Delete My Account
                </Button>
                {#if deleteError}
                    <P class="mt-4 text-red-600 dark:text-red-500 text-sm">
                        {@html deleteError}
                    </P>
                {/if}
            </div>
        </div>
    {/if}
</div>

{#if isDeleteModalOpen}
    <DeleteConfirmationModal
        open={isDeleteModalOpen}
        message={`Are you sure you want to delete the category \"${categoryToDelete}\"? This action cannot be undone.`}
        on:confirm={confirmDelete}
        on:cancel={() => isDeleteModalOpen = false}
    />
{/if}

{#if isRenameModalOpen && categoryToRename}
    <RenameModal 
        open={isRenameModalOpen} 
        currentName={categoryToRename}
        on:save={handleRename}
        on:cancel={() => isRenameModalOpen = false}
    />
{/if}

{#if isDeleteAccountModalOpen}
    <DestructiveConfirmationModal
        open={isDeleteAccountModalOpen}
        heading="Are you absolutely sure?"
        message="This will permanently delete your account and all of its data, including every game, category, and tag you have created. This action cannot be undone."
        confirmationText="DELETE"
        on:confirm={handleDeleteAccount}
        on:cancel={() => isDeleteAccountModalOpen = false}
    />
{/if}
