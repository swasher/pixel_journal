<script lang="ts">
    import { Heading, Label, Tags, Button, Spinner, Table, TableHead, TableHeadCell, TableBody, TableBodyRow, TableBodyCell, Input, P, Select } from 'flowbite-svelte';
    import { user, db, updateGameStatuses, auth } from '$lib/firebase';
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

    // Create a local, editable copy of the settings for the forms
    let localSettings = $state({ ...$userSettings });
    $effect(() => {
        // This effect keeps the local copy in sync if the store changes from elsewhere
        localSettings = { ...$userSettings };
    });

    // Tags are also part of the userSettings store, but the Tags component needs a writable variable.
    // This effect syncs the store value to a local state variable.
    let userTags = $state<string[]>([]);
    $effect(() => {
        userTags = $userSettings.tags;
    });

    async function saveApiSettings() {
        if (!$currentUser) {
            alert('You must be logged in to save settings.');
            return;
        }
        isLoading = true;
        try {
            const userSettingsRef = doc(db, 'users', $currentUser.uid);
            // We only save the settings relevant to this form
            const settingsToSave = {
                dataSource: localSettings.dataSource,
                rawgApiKey: localSettings.rawgApiKey,
                igdbClientId: localSettings.igdbClientId,
                igdbClientSecret: localSettings.igdbClientSecret
            };
            await setDoc(userSettingsRef, settingsToSave, { merge: true });
            // Optionally, show a success message to the user
            alert('API Settings saved!');
        } catch (error) {
            console.error("Error saving API settings: ", error);
            alert('Failed to save API settings.');
        } finally {
            isLoading = false;
        }
    }

    async function getIgdbToken() {
        if (!$currentUser) {
            alert('You must be logged in.');
            return;
        }

        const { igdbClientId, igdbClientSecret } = $userSettings;

        if (!igdbClientId || !igdbClientSecret) {
            alert('Please save your IGDB Client ID and Client Secret before getting a token.');
            return;
        }

        isLoading = true;
        try {
            const response = await fetch('/api/auth/igdb', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ clientId: igdbClientId, clientSecret: igdbClientSecret })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to get access token.');
            }

            const { access_token } = data;
            const userSettingsRef = doc(db, 'users', $currentUser.uid);
            await setDoc(userSettingsRef, { igdbAccessToken: access_token }, { merge: true });

            alert(`Successfully received and saved new IGDB access token!`);

        } catch (error: any) {
            console.error("Error getting IGDB token: ", error);
            alert(`Failed to get IGDB token: ${error.message}`);
        } finally {
            isLoading = false;
        }
    }

    async function saveTags() {
        if (!$currentUser) {
            alert('You must be logged in to save settings.');
            return;
        }
        isLoading = true;
        try {
            const userSettingsRef = doc(db, 'users', $currentUser.uid);
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
            const userSettingsRef = doc(db, 'users', $currentUser.uid);
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
            const userSettingsRef = doc(db, 'users', $currentUser.uid);
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

    async function handleRename(newName: string) {
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
            const userSettingsRef = doc(db, 'users', $currentUser.uid);
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

        // The new cleanup logic for the nested structure
        const cleanupUserData = async () => {
            console.log(`Starting data cleanup for user: ${userId}`);

            // Helper function to delete all documents in a collection in batches
            const deleteCollection = async (collRef: any) => {
                const snapshot = await getDocs(collRef);
                if (snapshot.empty) return 0;

                const docs = snapshot.docs;
                for (let i = 0; i < docs.length; i += 500) {
                    const batch = writeBatch(db);
                    const chunk = docs.slice(i, i + 500);
                    chunk.forEach(doc => batch.delete(doc.ref));
                    await batch.commit();
                }
                return snapshot.size;
            }

            // 1. Delete all games
            const gamesDeleted = await deleteCollection(collection(db, 'users', userId, 'games'));
            console.log(`Deleted ${gamesDeleted} games.`);

            // 2. Delete all articles
            const articlesDeleted = await deleteCollection(collection(db, 'users', userId, 'articles'));
            console.log(`Deleted ${articlesDeleted} articles.`);
            
            // 3. Delete user settings document
            console.log(`Starting deletion of user document for user: ${userId}`);
            const userDocRef = doc(db, 'users', userId);
            await deleteDoc(userDocRef);

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

            <!-- Data Sources & API Keys Section -->
            <div class="border-t dark:border-gray-700 pt-8 mt-8">
                <Heading tag="h2" class="text-xl font-bold mb-2">Data Sources & API Keys</Heading>
                <P class="text-gray-600 dark:text-gray-400 mb-4">
                    Choose your preferred data source for fetching game information and provide your personal API keys.
                </P>
                <div class="space-y-4">
                    <div>
                        <Label for="data-source" class="block mb-2 font-medium">Data Source</Label>
                        <Select id="data-source" bind:value={localSettings.dataSource}>
                            <option value="rawg">RAWG.io</option>
                            <option value="igdb">IGDB.com</option>
                        </Select>
                    </div>
                    <div>
                        <Label for="rawg-key" class="block mb-2 font-medium">RAWG.io API Key</Label>
                        <Input id="rawg-key" type="password" placeholder="Enter your RAWG.io API key" bind:value={localSettings.rawgApiKey} />
                    </div>
                    <div>
                        <Label for="igdb-client-id" class="block mb-2 font-medium">IGDB.com Client ID</Label>
                        <Input id="igdb-client-id" type="password" placeholder="Enter your IGDB.com Client ID" bind:value={localSettings.igdbClientId} />
                    </div>
                    <div>
                        <Label for="igdb-client-secret" class="block mb-2 font-medium">IGDB.com Client Secret</Label>
                        <div class="flex items-center gap-2">
                            <Input id="igdb-client-secret" type="password" placeholder="Enter your IGDB.com Client Secret" bind:value={localSettings.igdbClientSecret} class="flex-grow"/>
                            <Button onclick={getIgdbToken} disabled={isLoading} outline>Get Access Token</Button>
                        </div>
                    </div>
                </div>
                 <div class="flex justify-end border-t dark:border-gray-700 pt-4 mt-4">
                    <Button onclick={saveApiSettings} disabled={isLoading}>Save API Settings</Button>
                </div>
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
        onconfirm={confirmDelete}
        oncancel={() => isDeleteModalOpen = false}
    />
{/if}

{#if isRenameModalOpen && categoryToRename}
    <RenameModal 
        open={isRenameModalOpen} 
        currentName={categoryToRename}
        onsave={handleRename}
        oncancel={() => isRenameModalOpen = false}
    />
{/if}

{#if isDeleteAccountModalOpen}
    <DestructiveConfirmationModal
        open={isDeleteAccountModalOpen}
        heading="Are you absolutely sure?"
        message="This will permanently delete your account and all of its data, including every game, category, and tag you have created. This action cannot be undone."
        confirmationText="DELETE"
        onconfirm={handleDeleteAccount}
        oncancel={() => isDeleteAccountModalOpen = false}
    />
{/if}
