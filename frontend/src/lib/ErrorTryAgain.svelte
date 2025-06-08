<script>
    /** @type {{
     *      error: any,
     *      onTryAgain: (() => void) | (() => Promise<void>),
    }} */
    let { error, onTryAgain } = $props();
</script>

<section class="error-wrapper">
    <p>{error.message || 'An unexpected error has occurred.'}</p>
    <button class="btn btn-outline" onclick={onTryAgain}>
        Try Again
    </button>
</section>