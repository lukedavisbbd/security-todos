<script>
    /**
     * @param {string} input
     */
    const hashSha256Hex = async (input) => {
        const inBuffer = new TextEncoder().encode(input);
        const outBuffer = await window.crypto.subtle.digest('SHA-256', inBuffer);
        return [...new Uint8Array(outBuffer)].map(x => x.toString(16).padStart(2, '0')).join('');
    }

    /**
     * Get user initials for profile logo
     * @param {string} name
     */
    const getUserInitials = (name) => {
        return name.split(' ').map(n => n.substring(0, 1).toUpperCase()).join('');
    };

    /**
     * @param {string} email
     */
    const getGravatarUrl = async (email) => {
        try {
            if (email && window.crypto) {
                const hash = await hashSha256Hex(email.trim().toLowerCase());
                return `https://gravatar.com/avatar/${hash}?d=identicon&s=256`;
            } else {
                // display initials on error
                return '';
            }
        } catch {
            // display initials on error
            return '';
        }
    };

    /** @type {{ email: string, name: string }} */
    let { email, name } = $props();

    let gravatarUrl = $derived(getGravatarUrl(email));
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
