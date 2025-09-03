<script lang="ts">
    import { Modal, Button, Label, Input } from 'flowbite-svelte';
    import { ExclamationCircleOutline } from 'flowbite-svelte-icons';
    import { createEventDispatcher } from 'svelte';

    type Props = {
        open: boolean;
        heading?: string;
        message: string;
        confirmationText: string;
    };

    let { open, heading = 'Confirm Destructive Action', message, confirmationText }: Props = $props();

    const dispatch = createEventDispatcher();

    let confirmationInput = $state('');
    let isConfirmed = $derived(confirmationInput === confirmationText);

    function handleConfirm() {
        if (isConfirmed) {
            dispatch('confirm');
        }
    }

    function handleCancel() {
        dispatch('cancel');
    }
</script>

<Modal bind:open={open} size="md" autoclose={false} on:close={handleCancel}>
    <div class="text-center">
        <ExclamationCircleOutline class="mx-auto mb-4 h-14 w-14 text-gray-400 dark:text-gray-200" />
        <h3 class="mb-5 text-lg font-normal text-gray-500 dark:text-gray-400">
            {heading}
        </h3>
        <p class="mb-5 text-sm text-gray-500 dark:text-gray-400">
            {@html message}
        </p>

        <div class="mb-6 text-left">
            <Label for="confirmation" class="block mb-2 text-sm font-medium">
                To confirm, type "<span class="font-bold text-red-600">{confirmationText}</span>" in the box below.
            </Label>
            <Input
                id="confirmation"
                type="text"
                bind:value={confirmationInput}
                placeholder={confirmationText}
                required
            />
        </div>

        <div class="flex justify-center gap-4">
            <Button color="red" onclick={handleConfirm} disabled={!isConfirmed}>
                Yes, I'm sure
            </Button>
            <Button color="alternative" onclick={handleCancel}>
                No, cancel
            </Button>
        </div>
    </div>
</Modal>
