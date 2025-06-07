<script>
    import { userInitials, userProfileLogoSrc } from "../util/stores";

    /** @type {{ logoSrc?: Promise<string>, initials?: string }} */
    let { logoSrc, initials } = $props();
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

{#await logoSrc ?? $userProfileLogoSrc}
    <img alt={initials ?? $userInitials}/>
{:then logoSrc}
    <img src={logoSrc} alt={initials ?? $userInitials}/>
{/await}
