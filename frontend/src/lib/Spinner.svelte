<script>
  import { LoaderCircle } from "@lucide/svelte";
</script>

<style>
    .loader-container {
        color: grey;
        display: inline-flex;
        justify-content: center;
        align-items: center;
    }
</style>

<div class="loader-container animate-spin">
    <LoaderCircle class="full"/>
</div>
