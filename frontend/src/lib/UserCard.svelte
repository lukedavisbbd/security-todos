<script>
  import { LogOut, Plus, RotateCcwKey, X } from "@lucide/svelte";
    import { gravatarUrl } from "../util/stores";
    import ProfileLogo from "./ProfileLogo.svelte";
    import Spinner from "./Spinner.svelte";
    import { clickOutside } from "../util/click-outside";
    import { addRole, deleteRole } from "../util/access-control";

    /** @type {{ user: import('common').UserWithRoles, allRoles: Promise<import('../util/http').ApiResult<string[]> | null>, onChangeRoles: (newRoles: string[]) => void }} */
    let { user, allRoles, onChangeRoles } = $props();

    let showAddMenu = $state(false);
</script>

<style>
    article {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
        border: 1px solid #0003;
        border-radius: 0.3rem;
        padding: 0.5rem 0.75rem;
        margin: 1rem 0;

        section {
            display: flex;
            align-items: center;
            flex-wrap: wrap;
            gap: 0.5rem;
        }

        .profile {
            flex-shrink: 0;
        }

        .roles {
            flex-grow: calc(infinity);
            
            .chip {
                display: flex;
                align-items: center;
                font-family: monospace;
                font-size: 0.75rem;
                background-color: green;
                border-radius: 0.3rem;
                color: white;
                user-select: none;
                flex-shrink: 0;

                span {
                    padding: 0.1rem 0 0.1rem 0.4rem;
                }

                button {
                    padding: 0.2rem 0.3rem;
                }
            }
        }

        .buttons {
            flex-grow: 1;
            justify-content: end;
        }
    }

    .add-button-wrapper {
        position: relative;

        button {
            padding: 0.2rem;
            font-size: 1rem;
        }

        menu {
            position: absolute;
            left: 100%;
            top: 0;
            display: flex;
            gap: 0.5rem;
            flex-wrap: wrap;
            background-color: #fafafa;
            border: 1px solid #0001;
            border-radius: 0.35rem;
            box-shadow: 0 0.1rem 0.2rem #0001;
            margin: 0;
            padding: 0.5rem;

            .error {
                text-wrap-mode: nowrap;
            }
        }
    }
</style>

<article>
    <section class="profile">
        <ProfileLogo logoSrc={gravatarUrl(user.user.email)} initials={user.user.name.split(' ').map(name => name.substring(0, 1).toUpperCase()).join('')}/>
        {user.user.name}
    </section>
    <section class="roles">
        {#each user.roles as role}
            <div class="chip">
                <span>
                    {role}
                </span>
                <button onclick={async () => {
                    const result = await deleteRole(user.user.userId, role);
                    if (result && 'ok' in result) {
                        onChangeRoles(result.ok);
                    }
                }}>
                    <X/>
                </button>
            </div>
        {/each}
        <div class="add-button-wrapper">
            <button class="btn" title="Add Role" onclick={() => showAddMenu = true}>
                <Plus class="full"/>
            </button>
            {#if showAddMenu}
                <menu use:clickOutside={() => showAddMenu = false}>
                    {#await allRoles}
                        <Spinner/>
                    {:then allRoles}
                        {#if !allRoles || 'err' in allRoles}
                            <p class="error">Failed to fetch role list.</p>
                        {:else}
                            {#each allRoles.ok.filter(role => !user.roles.includes(role)) as role}
                                <div class="chip">
                                    <span>
                                        {role}
                                    </span>
                                    <button onclick={async () => {
                                        showAddMenu = false;
                                        const result = await addRole(user.user.userId, role);
                                        if (result && 'ok' in result) {
                                            onChangeRoles(result.ok);
                                        }
                                    }}>
                                        <Plus/>
                                    </button>
                                </div>
                            {/each}
                        {/if}
                    {/await}
                </menu>
            {/if}
        </div>
    </section>
    <section class="buttons">
        <button class="btn btn-outline">
            <RotateCcwKey/>
            Reset Password
        </button>
        <button class="btn btn-danger">
            <LogOut/>
            Force Logout
        </button>
    </section>
</article>