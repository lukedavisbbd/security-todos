<script>
  import { userInitials, userProfileLogoSrc } from "../util/stores";
</script>

<style>
    img {
        display: flex;
        justify-content: center;
        align-items: center;
        background-color: lightgrey;
        width: 1.75rem;
        height: 1.75rem;
        border-radius: calc(1px * infinity);
    }
</style>

{#await $userProfileLogoSrc}
    <img alt={$userInitials}/>
{:then logoSrc}
    <img src={logoSrc} alt={$userInitials}/>
{/await}
