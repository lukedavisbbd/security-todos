<script>
    import { X } from "@lucide/svelte";
    import { fade } from "svelte/transition";
    import Spinner from "../Spinner.svelte";
    import { CreateTeamSchema } from "common";
    import { createTeam } from "../../util/team";
    import { z } from "zod/v4";

    /**
     * @param {MouseEvent | KeyboardEvent} e
     */
    const tryClose = (e) => {
        if (e instanceof KeyboardEvent && e.key != 'Escape') {
            return;
        }
        if (!createPromise) {
            close();
        }
    };

    const performCreateTeam = async () => {
        createErrors = null;
        
        const request = CreateTeamSchema.safeParse({
            teamName,
        });

        if (request.error) {
            createErrors = z.treeifyError(request.error);
            return;
        }

        const result = await createTeam(request.data.teamName);

        if (!result) {
            createErrors = {
                errors: ['Failed to create team.'],
            };
            return;
        }
        
        if ('ok' in result) {
            onTeamCreated(result.ok);
            close();
        } else {
            createErrors = /** @type {{ errors?: string[], properties?: { teamName?: { errors?: string[] } } } | null} */(
                result.err.data
            );
        }
    };

    /** @type {{ close: () => void, onTeamCreated: (team: import('common').Team) => void }} */
    let { close, onTeamCreated } = $props();

    let teamName = $state("");
    
    /** @type {Promise<void> | null} */
    let createPromise = $state(null);
    /** @type {{ errors?: string[], properties?: { teamName?: { errors?: string[] } } } | null} */
    let createErrors = $state(null);
</script>

<style>
    .loader-wrapper {
        display: flex;
        justify-content: center;
        align-items: center;
        margin: 0 auto;
        width: 100%;
        max-width: 12rem;
        aspect-ratio: 1;
        font-size: 4rem;
    }
</style>

<div transition:fade={{ duration: 150 }} class="modal-wrapper grey-zone" aria-hidden="true" onclick={tryClose} onkeydown={tryClose}>
    <dialog open onclick={e => e.stopPropagation()}>
        {#if createPromise}
            <article>
                <div class="loader-wrapper">
                    <Spinner/>
                </div>
            </article>
        {:else}
            <header>
                Create Team
                <button class="btn btn-small" onclick={close}>
                    <X class="full"/>
                </button>
            </header>
            <form onsubmit={e => {
                e.preventDefault();
                createPromise = performCreateTeam().then(() => {
                    createPromise = null;
                });
            }}>
                <article>
                    {#if createErrors?.errors?.at(0)}
                        <p class="error">{createErrors.errors[0]}</p>
                    {/if}
                    <div>
                        <label class="inline" for="team-name">Team Name</label>
                        <input
                            bind:value={teamName} type="text" name="team-name" id="team-name"
                            placeholder="" autocomplete="organization"
                            required maxlength="64"
                        >
                        {#if createErrors?.properties?.teamName?.errors?.at(0)}
                            <p class="error">{createErrors.properties.teamName.errors[0]}</p>
                        {/if}
                    </div>
                </article>
                <footer>
                    <button class="btn btn-outline btn-dark btn-center w-full">
                        Create Team
                    </button>
                </footer>
            </form>
        {/if}
    </dialog>
</div>