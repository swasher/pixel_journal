<script lang="ts">
    import { Modal, Label, Input, Button, Select } from 'flowbite-svelte';

    let { open, currentName, currentColor, onsave, oncancel } = $props<{
        open: boolean;
        currentName: string;
        currentColor: string;
        onsave: (newName: string, newColor: string) => void;
        oncancel: () => void;
    }>();

    let newName = $state(currentName);
    let newColor = $state(currentColor);

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

    function handleSubmit(e: SubmitEvent) {
        e.preventDefault();
        onsave(newName.trim(), newColor);
    }
</script>

<Modal bind:open title="Edit Tag" size="xs" autoclose={false} class="w-full">
    <form class="flex flex-col space-y-4" onsubmit={handleSubmit}>
        <div>
            <Label for="tag-name" class="mb-2">Tag Name</Label>
            <Input id="tag-name" type="text" bind:value={newName} required placeholder="Enter tag name" />
        </div>
        
        <div>
            <Label for="tag-color" class="mb-2">Color</Label>
            <Select id="tag-color" items={availableColors} bind:value={newColor} />
        </div>

        <div class="flex justify-end gap-2 mt-4">
            <Button color="alternative" onclick={oncancel}>Cancel</Button>
            <Button type="submit">Save</Button>
        </div>
    </form>
</Modal>
