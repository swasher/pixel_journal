<script lang="ts">
    import { Heading, Label, Badge, Button, Spinner, Table, TableHead, TableHeadCell, TableBody, TableBodyRow, TableBodyCell, Input, P, Select, Tooltip } from 'flowbite-svelte';
    import { user, db, updateGameStatuses, auth } from '$lib/firebase';
    import { userSettings } from '$lib/stores/userSettings';
    import { doc, setDoc, arrayUnion, updateDoc, arrayRemove, deleteDoc, query, collection, where, getDocs, getDoc, writeBatch, deleteField } from 'firebase/firestore'; 
    import { deleteUser, GoogleAuthProvider, reauthenticateWithPopup } from 'firebase/auth';
    import { goto } from '$app/navigation';
    import { PenOutline, TrashBinOutline, ChevronUpOutline, ChevronDownOutline, PlusOutline } from 'flowbite-svelte-icons';
    import DeleteConfirmationModal from '$lib/components/DeleteConfirmationModal.svelte';
    import RenameModal from '$lib/components/RenameModal.svelte';
    import TagEditModal from '$lib/components/TagEditModal.svelte';
    import DestructiveConfirmationModal from '$lib/components/DestructiveConfirmationModal.svelte';

    let newCategory = $state('');
    let newTagInput = $state(''); 
    let newTagColor = $state('indigo'); // Default color
    let isLoading = $state(false);
    const currentUser = $derived(user);

    let isDeleteModalOpen = $state(false);
    let categoryToDelete = $state<string | null>(null);
    
    // Tag deletion/editing state
    let isTagDeleteModalOpen = $state(false);
    let tagToDelete = $state<string | null>(null);
    
    let isTagEditModalOpen = $state(false);
    let tagToEditName = $state('');
    let tagToEditColor = $state('indigo');
    let oldTagName = $state(''); // Keep track of the original name for renaming logic

    let isRenameModalOpen = $state(false);
    let categoryToRename = $state<string | null>(null);

    let isDeleteAccountModalOpen = $state(false);
    let deleteError = $state<string | null>(null);

    const availableColors = [
        { value: 'indigo', name: 'Indigo' },
        { value: 'blue', name: 'Blue' },
        { value: 'red', name: 'Red' },
        { value: 'green', name: 'Green' },
        { value: 'yellow', name: 'Yellow' },
        { value: 'purple', name: 'Purple' },
        { value: 'pink', name: 'Pink' },
        { value: 'dark', name: 'Dark' }
    ];

    // Create a local, editable copy of the settings for the forms
    let localSettings = $state({ ...$userSettings });
    $effect(() => {
        // This effect keeps the local copy in sync if the store changes from elsewhere
        localSettings = { ...$userSettings };
    });

    // Use derived state for tags directly from the store
    let userTags = $derived($userSettings.tags || []);

    function openEditTagModal(tag: string) {
        oldTagName = tag;
        tagToEditName = tag;
        // Get current color or default to indigo
        tagToEditColor = ($userSettings.tagColors && $userSettings.tagColors[tag]) || 'indigo';
        isTagEditModalOpen = true;
    }

    async function handleEditTag(newName: string, newColor: string) {
        if (!oldTagName || !$currentUser) return;
        
        // Optimistic close
        isTagEditModalOpen = false;

        try {
            const batch = writeBatch(db);
            const userRef = doc(db, 'users', $currentUser.uid);

            // Case 1: Only color changed
            if (newName === oldTagName) {
                 batch.update(userRef, {
                    [`tagColors.${oldTagName}`]: newColor
                 });
                 await batch.commit();
                 return;
            }

            // Case 2: Renaming (Complex)
            if (userTags.includes(newName)) {
                alert('Tag with this name already exists!');
                return;
            }

            // 1. Update Global Settings: Add new, Remove old
            batch.update(userRef, {
                tags: arrayUnion(newName),
                [`tagColors.${newName}`]: newColor,
            });
            batch.update(userRef, {
                tags: arrayRemove(oldTagName),
                [`tagColors.${oldTagName}`]: deleteField()
            });

            // 2. Migrate Games
            const gamesRef = collection(db, 'users', $currentUser.uid, 'games');
            const q = query(gamesRef, where('tags', 'array-contains', oldTagName));
            const querySnapshot = await getDocs(q);

            querySnapshot.forEach((doc) => {
                const gameRef = doc.ref;
                batch.update(gameRef, {
                    tags: arrayRemove(oldTagName)
                });
                 batch.update(gameRef, {
                    tags: arrayUnion(newName)
                });
            });

            await batch.commit();

        } catch (error) {
            console.error("Error editing tag: ", error);
            alert("Failed to edit tag");
        }
    }

    async function addTag() {
        const tag = newTagInput.trim();
        if (!tag) return;
        if (userTags.includes(tag)) {
            alert('Tag already exists');
            return;
        }

        const color = newTagColor;
        
        // Clear inputs immediately
        newTagInput = '';
        newTagColor = 'indigo'; 
        
        if (!$currentUser) return;

        try {
            const userSettingsRef = doc(db, 'users', $currentUser.uid);
            await updateDoc(userSettingsRef, {
                tags: arrayUnion(tag),
                [`tagColors.${tag}`]: color
            });
        } catch (error) {
            console.error("Error adding tag: ", error);
            alert('Failed to add tag');
        }
    }

    function openDeleteTagModal(tag: string) {
        tagToDelete = tag;
        isTagDeleteModalOpen = true;
    }

    async function confirmDeleteTag() {
        if (!tagToDelete || !$currentUser) return;
        
        const tagToRemove = tagToDelete; 

        try {
            const batch = writeBatch(db);
            const userRef = doc(db, 'users', $currentUser.uid);
            
            // 1. Remove tag from global settings array AND the color map
            batch.update(userRef, {
                tags: arrayRemove(tagToRemove),
                [`tagColors.${tagToRemove}`]: deleteField()
            });

            // 2. Find all games containing this tag and remove it
            const gamesRef = collection(db, 'users', $currentUser.uid, 'games');
            const q = query(gamesRef, where('tags', 'array-contains', tagToRemove));
            const querySnapshot = await getDocs(q);

            querySnapshot.forEach((doc) => {
                const gameRef = doc.ref;
                batch.update(gameRef, {
                    tags: arrayRemove(tagToRemove)
                });
            });

            // 3. Commit all changes atomically
            await batch.commit();
            
            isTagDeleteModalOpen = false;
            tagToDelete = null;

        } catch (error) {
            console.error("Error removing tag: ", error);
            alert('Failed to remove tag');
        }
    }

    async function saveApiSettings() {
        if (!$currentUser) {
            alert('You must be logged in to save settings.');
            return;
        }
        isLoading = true;
        try {
            const userSettingsRef = doc(db, 'users', $currentUser.uid);
            const settingsToSave = {
                dataSource: localSettings.dataSource,
                rawgApiKey: localSettings.rawgApiKey,
                igdbClientId: localSettings.igdbClientId,
                igdbClientSecret: localSettings.igdbClientSecret
            };
            await setDoc(userSettingsRef, settingsToSave, { merge: true });
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

    async function moveCategoryUp(categoryName: string) {
        if (!$currentUser) return;

        const userSettingsRef = doc(db, 'users', $currentUser.uid);
        const userSettingsDoc = await getDoc(userSettingsRef);
        const userData = userSettingsDoc.data();

        const categories = [...userData.categories]; 
        const currentIndex = categories.indexOf(categoryName);

        if (currentIndex <= 0) return; 

        [categories[currentIndex], categories[currentIndex - 1]] =
        [categories[currentIndex - 1], categories[currentIndex]];

        await updateDoc(userSettingsRef, { categories: categories });
    }

    async function moveCategoryDown(categoryName: string) {
        if (!$currentUser) return;

        const userSettingsRef = doc(db, 'users', $currentUser.uid);
        const userSettingsDoc = await getDoc(userSettingsRef);
        const userData = userSettingsDoc.data();

        const categories = [...userData.categories]; 
        const currentIndex = categories.indexOf(categoryName);

        if (currentIndex === -1 || currentIndex >= categories.length - 1) return; 

        [categories[currentIndex], categories[currentIndex + 1]] =
        [categories[currentIndex + 1], categories[currentIndex]];

        await updateDoc(userSettingsRef, { categories: categories });
    }

    function openDeleteAccountModal() {
        deleteError = null; 
        isDeleteAccountModalOpen = true;
    }

    async function handleDeleteAccount() {
        if (!$currentUser) return;

        isLoading = true;
        deleteError = null;
        const userId = $currentUser.uid;

        const cleanupUserData = async () => {
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

            await deleteCollection(collection(db, 'users', userId, 'games'));
            await deleteCollection(collection(db, 'users', userId, 'articles'));
            
            const userDocRef = doc(db, 'users', userId);
            await deleteDoc(userDocRef);
        };

        try {
            await cleanupUserData();
            await deleteUser($currentUser);
            isDeleteAccountModalOpen = false;
            await goto('/');
        } catch (error: any) {
            if (error.code === 'auth/requires-recent-login') {
                try {
                    const provider = new GoogleAuthProvider();
                    await reauthenticateWithPopup($currentUser, provider);
                    await cleanupUserData();
                    await deleteUser($currentUser);
                    isDeleteAccountModalOpen = false;
                    await goto('/');
                } catch (reauthError: any) {
                    deleteError = 'Re-authentication failed. Please log out and log back in to delete your account.';
                    isTagEditModalOpen = false; 
                }
            } else {
                deleteError = 'An error occurred while deleting your account. Please try again.';
                isTagEditModalOpen = false; 
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
                    Add tags to organize your games. You can assign colors to them.
                </p>
                
                <div class="border dark:border-gray-700 rounded-lg mb-4">
                     <Table>
                        <TableHead>
                            <TableHeadCell>Tag Name</TableHeadCell>
                            <TableHeadCell>Preview</TableHeadCell>
                            <TableHeadCell class="text-right">Actions</TableHeadCell>
                        </TableHead>
                        <TableBody>
                            {#each userTags as tag (tag)}
                                {@const tagColor = $userSettings.tagColors?.[tag] || 'indigo'}
                                <TableBodyRow>
                                    <TableBodyCell class="font-medium">{tag}</TableBodyCell>
                                    <TableBodyCell>
                                        <Badge color={tagColor as any} rounded>{tag}</Badge>
                                    </TableBodyCell>
                                    <TableBodyCell class="text-right">
                                        <div class="flex items-center justify-end gap-1">
                                            <Button size="xs" color="light" class="!p-2" onclick={() => openEditTagModal(tag)}>
                                                <PenOutline class="w-4 h-4 text-gray-500 dark:text-gray-400"/>
                                            </Button>
                                            <Button size="xs" color="red" class="!p-2" onclick={() => openDeleteTagModal(tag)}>
                                                <TrashBinOutline class="w-4 h-4"/>
                                            </Button>
                                        </div>
                                    </TableBodyCell>
                                </TableBodyRow>
                            {/each}
                             {#if userTags.length === 0}
                                <TableBodyRow>
                                    <TableBodyCell colspan="3" class="text-center text-gray-500">
                                        No tags created yet.
                                    </TableBodyCell>
                                </TableBodyRow>
                            {/if}
                        </TableBody>
                    </Table>
                </div>

                <form onsubmit={(e) => { e.preventDefault(); addTag(); }} class="flex items-center gap-2">
                     <Input id="new-tag" bind:value={newTagInput} placeholder="Enter a new tag" class="flex-grow" required />
                     <Select items={availableColors} bind:value={newTagColor} class="w-36" />
                     <Button type="submit" class="w-48" disabled={isLoading}>
                         Add Tag
                     </Button>
                </form>
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
                                    <TableBodyCell class="text-right">
                                        <div class="flex items-center justify-end gap-3">
                                            <div class="flex items-center gap-1">
                                                <Button
                                                    size="xs"
                                                    color="light"
                                                    class="!p-2"
                                                    onclick={() => moveCategoryUp(category)}
                                                    disabled={$userSettings.categories.indexOf(category) === 0}
                                                >
                                                    <ChevronUpOutline class="w-4 h-4 text-gray-500 dark:text-gray-400" />
                                                </Button>
                                                <Tooltip>Move Up</Tooltip>

                                                <Button
                                                    size="xs"
                                                    color="light"
                                                    class="!p-2"
                                                    onclick={() => moveCategoryDown(category)}
                                                    disabled={$userSettings.categories.indexOf(category) === $userSettings.categories.length - 1}
                                                >
                                                    <ChevronDownOutline class="w-4 h-4 text-gray-500 dark:text-gray-400" />
                                                </Button>
                                                <Tooltip>Move Down</Tooltip>
                                            </div>

                                            <div class="w-px h-4 bg-gray-300 dark:bg-gray-600"></div>

                                            <div class="flex items-center gap-1">
                                                <Button size="xs" color="light" class="!p-2" onclick={() => openRenameModal(category)}>
                                                    <PenOutline class="w-4 h-4 text-gray-500 dark:text-gray-400"/>
                                                </Button>
                                                <Tooltip>Rename</Tooltip>
                                                
                                                <Button size="xs" color="red" class="!p-2" onclick={() => openDeleteModal(category)}>
                                                    <TrashBinOutline class="w-4 h-4"/>
                                                </Button>
                                                <Tooltip>Delete</Tooltip>
                                            </div>
                                        </div>
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

{#if isTagEditModalOpen}
    <TagEditModal
        open={isTagEditModalOpen}
        currentName={tagToEditName}
        currentColor={tagToEditColor}
        onsave={handleEditTag}
        oncancel={() => isTagEditModalOpen = false}
    />
{/if}

{#if isTagDeleteModalOpen}
    <DeleteConfirmationModal
        open={isTagDeleteModalOpen}
        message={`Are you sure you want to delete the tag \"${tagToDelete}\"? This will remove it from all games.`}
        onconfirm={confirmDeleteTag}
        oncancel={() => isTagDeleteModalOpen = false}
    />
{/if}

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
