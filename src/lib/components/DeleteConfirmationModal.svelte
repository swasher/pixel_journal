<script lang="ts">
    import { Modal, Button } from 'flowbite-svelte';
    import { ExclamationCircleOutline } from 'flowbite-svelte-icons';
    import { createEventDispatcher } from 'svelte';

    let { open, message, class: className = '' } = $props<{ 
        open: boolean; 
        message: string; 
        class?: string;
    }>();

    const dispatch = createEventDispatcher<{ confirm: void; cancel: void }>();

    function handleConfirm() {
        dispatch('confirm');
    }

    function handleCancel() {
        dispatch('cancel');
    }
</script>

<Modal bind:open={open} size="sm" autoclose={false} popup class={className}>
    <div class="text-center">
        <ExclamationCircleOutline class="mx-auto mb-4 h-12 w-12 text-gray-400 dark:text-gray-200" />
        <h3 class="mb-5 text-lg font-normal text-gray-500 dark:text-gray-400">
            {message}
        </h3>
        <Button color="red" class="me-2" onclick={handleConfirm}>Yes, I'm sure</Button>
        <Button color="alternative" onclick={handleCancel}>No, cancel</Button>
    </div>
</Modal>
