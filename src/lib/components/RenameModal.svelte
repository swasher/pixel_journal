<script lang="ts">
    import { Modal, Button, Input, Label } from 'flowbite-svelte';
    import { createEventDispatcher } from 'svelte';

    let { open, currentName } = $props<{ open: boolean; currentName: string }>();

    let newName = $state(currentName);

    const dispatch = createEventDispatcher<{ save: string; cancel: void }>();

    // When the modal opens, reset the newName to the currentName
    $effect(() => {
        if (open) {
            newName = currentName;
        }
    });

    function handleSave(event: SubmitEvent) {
        event.preventDefault();
        if (newName.trim() && newName.trim() !== currentName) {
            dispatch('save', newName.trim());
        } else {
            dispatch('cancel');
        }
    }

    function handleCancel() {
        dispatch('cancel');
    }
</script>

<Modal bind:open={open} size="sm" autoclose={false} popup>
    <form on:submit={handleSave}>
        <div class="p-4">
            <h3 class="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Rename Category</h3>
            <div class="space-y-4">
                <div>
                    <Label for="category-name" class="mb-2">Category Name</Label>
                    <Input id="category-name" type="text" bind:value={newName} required />
                </div>
                <div class="flex justify-end gap-2 pt-2">
                    <Button type="button" color="alternative" onclick={handleCancel}>Cancel</Button>
                    <Button type="submit">Save</Button>
                </div>
            </div>
        </div>
    </form>
</Modal>
