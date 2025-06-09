<script>
    import { X, AlertTriangle } from "@lucide/svelte";
    import { fade } from "svelte/transition";
    import Spinner from "../Spinner.svelte";
    import { deleteTeam } from "../../util/team";
    
    const tryClose = () => {
        if (!deletePromise) {
            close();
        }
    };
    
    const performDeleteTeam = async () => {
        deleteError = '';
        
        if (confirmationText.trim() !== team.teamName.trim()) {
            deleteError = 'Team name does not match. Please type the exact team name to confirm.';
            return;
        }
        
        try {
            await deleteTeam(team.teamId);
            onTeamDeleted();
        } catch (err) {
            deleteError = err.message || 'Failed to delete team.';
        }
    };
    /** @type {{ 
     *   team: import('common').Team,
     *   memberCount: number,
     *   taskCount: number,
     *   close: () => void, 
     *   onTeamDeleted: () => void 
     * }} */
    let { team, memberCount, taskCount, close, onTeamDeleted } = $props();
    let confirmationText = $state('');
    
    /** @type {Promise<void> | null} */
    let deletePromise = $state(null);
    let deleteError = $state('');
</script>

<style>
    dialog {
        border: none;
        background-color: #fafafa;
        box-shadow: 0 0.5rem 0.5rem #0001;
        position: absolute;
        z-index: 30;
        padding: 1.5rem;
        display: flex;
        flex-direction: column;
        border-radius: 1rem;
        gap: 1.5rem;
        width: 100%;
        max-width: 32rem;
    }
    .warning-header {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        color: #c53030;
        font-size: 1.25rem;
        font-weight: 600;
    }
    .consequences {
        background-color: #fed7d7;
        border: 1px solid #feb2b2;
        border-radius: 0.5rem;
        padding: 1rem;
        color: #742a2a;
    }
    .consequences h4 {
        margin: 0 0 0.75rem 0;
        font-weight: 600;
        color: #c53030;
    }
    .consequences ul {
        margin: 0;
        margin-top: 1rem;
        padding-left: 1.25rem;
        line-height: 1.6;
    }
    .consequences li {
        margin-bottom: 0.5rem;
    }
    .confirmation-section {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
    }
    .confirmation-label {
        font-weight: 500;
        color: #2d3748;
    }
    .team-name-highlight {
        font-family: monospace;
        background-color: #edf2f7;
        padding: 0.25rem 0.5rem;
        border-radius: 0.25rem;
        color: #2d3748;
        font-weight: 600;
    }
    .delete-input {
        font-family: monospace;
        font-weight: 600;
    }
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
    .btn-danger-confirm {
        background-color: #c53030;
        color: white;
    }
    .btn-danger-confirm:enabled:hover {
        background-color: #9c2626;
        color: #eee;
    }
    .btn-danger-confirm:disabled {
        background-color: #a0aec0;
        color: #718096;
        cursor: not-allowed;
    }
</style>

<div transition:fade={{ duration: 150 }} class="modal-wrapper grey-zone" aria-hidden="true" onclick={tryClose}>
    <dialog open onclick={e => e.stopPropagation()}>
        {#if deletePromise}
            <article>
                <div class="loader-wrapper">
                    <Spinner/>
                </div>
                <p style="text-align: center; color: #666;">Deleting team and all associated data...</p>
            </article>
        {:else}
            <header>
                <div class="warning-header">
                    <AlertTriangle class="warning-icon"/>
                    Delete Team
                </div>
                <button class="btn btn-small" onclick={close}>
                    <X class="full"/>
                </button>
            </header>

            <article>
                <div class="consequences">
                    <h4>This action cannot be undone!</h4>
                    <p>Deleting this team will permanently remove:</p>
                    <ul>
                        {#if taskCount >= 1}
                            <li>
                                {#if taskCount > 1}
                                    <strong>All {taskCount} tasks</strong>
                                {:else}
                                    <strong>The 1 task</strong>
                                {/if}
                                in this team
                            </li>
                        {/if}
                        <li>
                            <strong>All task history</strong>
                            and progress tracking
                        </li>
                        <li>
                            {#if memberCount > 1}
                                <strong>All {memberCount} team memberships</strong>
                            {:else}
                                <strong>Your team membership</strong>
                            {/if}
                        </li>
                        <li>
                            <strong>The team itself</strong>
                            and all associated data
                        </li>
                    </ul>
                </div>

                <div class="confirmation-section">
                    <label class="confirmation-label" for="confirmation">
                        To confirm deletion, type the team name: <span class="team-name-highlight">{team.teamName}</span>
                    </label>
                    <input
                        id="confirmation"
                        type="text"
                        name="confirmation"
                        placeholder="Type team name here..."
                        bind:value={confirmationText}
                        class="delete-input"
                        autocomplete="off"
                    >
                </div>

                {#if deleteError}
                    <p class="error">{deleteError}</p>
                {/if}
            </article>

            <footer>
                <button 
                    class="btn btn-center w-full btn-danger-confirm"
                    disabled={confirmationText.trim() !== team.teamName.trim()}
                    onclick={() => deletePromise = performDeleteTeam().then(() => { deletePromise = null })}
                >
                    {#if confirmationText.trim() !== team.teamName.trim()}
                        Type Team Name to Enable Delete
                    {:else}
                        Permanently Delete Team
                    {/if}
                </button>
            </footer>
        {/if}
    </dialog>
</div>
