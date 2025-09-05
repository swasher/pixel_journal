<script lang="ts">
    import { Modal, Button } from 'flowbite-svelte';
    import { ExclamationCircleOutline } from 'flowbite-svelte-icons';

    type Props = { 
        open: boolean; 
        message: string; 
        class?: string;
        onconfirm: () => void;
        oncancel: () => void;
    };

    let { open, message, class: className = '', onconfirm, oncancel } = $props<Props>();

</script>

<Modal bind:open={open} size="sm" autoclose={false} popup class={className} onclose={oncancel}>
    <div class="text-center">
        <ExclamationCircleOutline class="mx-auto mb-4 h-12 w-12 text-gray-400 dark:text-gray-200" />
        <h3 class="mb-5 text-lg font-normal text-gray-500 dark:text-gray-400">
            {message}
        </h3>
        <Button color="red" class="me-2" onclick={onconfirm}>Yes, I'm sure</Button>
        <Button color="alternative" onclick={oncancel}>No, cancel</Button>
    </div>
</Modal>