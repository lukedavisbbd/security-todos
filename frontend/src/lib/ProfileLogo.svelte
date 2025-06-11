<script>
  import { getUserPicture } from "../util/user";

    /**
     * Get user initials for profile logo
     * @param {string} name
     */
    const getUserInitials = (name) => {
        return name.split(' ').map(n => n.substring(0, 1).toUpperCase()).join('');
    };

    /** @type {{ userId: number, name: string }} */
    let { userId, name } = $props();

    let gravatarUrl = $derived((async (userId) => {
        try {
            return await getUserPicture(userId);
        } catch {
            return '';
        }
    })(userId));
    let initials = $derived(getUserInitials(name));
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

{#await gravatarUrl}
    <img alt={initials}/>
{:then gravatarUrl}
    <img src={gravatarUrl} alt={initials}/>
{/await}
