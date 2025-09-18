<script lang="ts">
    let { maxStars = 5, rating = 0, onchange } = $props<{
        maxStars?: number;
        rating: number;
        onchange: (newRating: number) => void;
    }>();

    let hoverRating = $state(0);

    function handleHover(r: number) {
        hoverRating = r;
    }

    function resetHover() {
        hoverRating = 0;
    }

    function getStarFill(starIndex: number) {
        const effectiveRating = hoverRating > 0 ? hoverRating : rating;
        return starIndex <= effectiveRating;
    }

    function handleClick(starIndex: number) {
        // Call the callback function passed from the parent
        onchange(starIndex);
    }
</script>

<div class="rating-container" onmouseleave={resetHover}>
    {#each Array(maxStars) as _, i}
        {@const starIndex = i + 1}
        <span
            class="star-wrapper"
            onclick={() => handleClick(starIndex)}
            onmouseenter={() => handleHover(starIndex)}
        >
            <svg
                class="star-icon"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill={getStarFill(starIndex) ? 'gold' : 'none'}
                stroke={getStarFill(starIndex) ? 'gold' : 'currentColor'}
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
            >
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.25l-6.18 3.25L7 14.14l-5-4.87 6.91-1.01L12 2z" />
            </svg>
        </span>
    {/each}
</div>

<style>
    .rating-container {
        display: flex;
        font-size: 1.5rem; /* Adjusted size */
        cursor: pointer;
    }

    .star-wrapper {
        width: 1.2em;
        height: 1.2em;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: transform 0.2s ease-in-out;
    }

    .star-wrapper:hover {
        transform: scale(1.1);
    }

    .star-icon {
        width: 80%;
        height: 80%;
    }
</style>
