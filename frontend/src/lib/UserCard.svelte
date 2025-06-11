<script>
    import { LogOut, Plus, RotateCcwKey, X } from "@lucide/svelte";
    import ProfileLogo from "./ProfileLogo.svelte";
    import Spinner from "./Spinner.svelte";
    import { clickOutside } from "../util/click-outside";
    import { addRole, deleteRole, logoutUser } from "../util/access-control";
    import PasswordResetTokenModal from "./modals/PasswordResetTokenModal.svelte";

    /** @type {{ user: import('common').UserWithRoles, allRoles: string[], onChangeRoles: (newRoles: string[]) => void }} */
    let { user, allRoles, onChangeRoles } = $props();

    /** @type {Promise<void> | null} */
    let logoutPromise = $state(null);
    let logoutError = $state('');

    let showAddMenu = $state(false);
    let showResetPassword = $state(false);

    const missingRoles = allRoles.filter(role => !user.roles.includes(role));
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
        }
    }

    .spinner-wrapper {
        :global(*) {
            color: white;
        }
    }

    .logout-button {
        display: flex;
        flex-direction: column;
        align-items: end;
        gap: 0;
    }
</style>

<article>
    <section class="profile">
        <ProfileLogo userId={user.user.userId} name={user.user.name}/>
        {user.user.name}
    </section>
    <section class="roles">
        {#each user.roles as role}
            <div class="chip">
                <span>
                    {role}
                </span>
                <button onclick={async () => {
                    const newRoles = await deleteRole(user.user.userId, role);
                    onChangeRoles(newRoles);
                }}>
                    <X/>
                </button>
            </div>
        {/each}
        {#if missingRoles.length > 0}
            <div class="add-button-wrapper">
                <button class="btn" title="Add Role" onclick={() => showAddMenu = true}>
                    <Plus class="full"/>
                </button>
                {#if showAddMenu}
                    <menu use:clickOutside={() => showAddMenu = false}>
                        {#each missingRoles as role}
                            <div class="chip">
                                <span>
                                    {role}
                                </span>
                                <button onclick={async () => {
                                    showAddMenu = false;
                                    const newRoles = await addRole(user.user.userId, role);
                                    onChangeRoles(newRoles);
                                }}>
                                    <Plus/>
                                </button>
                            </div>
                        {/each}
                    </menu>
                {/if}
            </div>
        {/if}
    </section>
    <section class="buttons">
        <section>
            <button class="btn btn-outline" onclick={() => showResetPassword = true}>
                <RotateCcwKey/>
                Reset Password
            </button>
        </section>
        <section class="logout-button">
            <button class="btn btn-danger" onclick={() => {
                logoutError = '';
                logoutPromise = logoutUser(user.user.userId)
                    .then(() => {
                        logoutPromise = null;
                    })
                    .catch(err => {
                        logoutError = err.message || 'Failed to logout user.';
                        logoutPromise = null;
                    });
            }}
            >
                {#if logoutPromise}
                    <div class="spinner-wrapper">
                        <Spinner/>
                    </div>
                {:else}
                    <LogOut/>
                {/if}
                Force Logout
            </button>
            {#if logoutError}
                <p class="error">{logoutError}</p>
            {/if}
        </section>
    </section>
</article>

{#if showResetPassword}
    <PasswordResetTokenModal userId={user.user.userId} close={() => showResetPassword = false}/>
{/if}
