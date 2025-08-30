<script lang="ts">
    import { Modal, Button } from 'flowbite-svelte';
    import { ExclamationCircleOutline } from 'flowbite-svelte-icons';

    let { open, onConfirm, onCancel, message } = $props<{ 
        open: boolean; 
        onConfirm: () => void; 
        onCancel: () => void; 
        message: string; 
    }>();

    // let isModalOpen = $state(open);
    let isModalOpen = $derived(open);

    function handleConfirm() {
        onConfirm();
        isModalOpen = false;
    }

    function handleCancel() {
        onCancel();
        isModalOpen = false;
    }
</script>

<Modal bind:open={isModalOpen} size="sm" autoclose={false} popup>
    <div class="text-center">
        <ExclamationCircleOutline class="mx-auto mb-4 h-12 w-12 text-gray-400 dark:text-gray-200" />
        <h3 class="mb-5 text-lg font-normal text-gray-500 dark:text-gray-400">
            {message}
        </h3>
        <Button color="red" class="me-2" onclick={handleConfirm}>Yes, I'm sure</Button>
        <Button color="alternative" onclick={handleCancel}>No, cancel</Button>
    </div>
</Modal>
