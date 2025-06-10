<script>
    import { X } from "@lucide/svelte";
    import { fade } from "svelte/transition";

    /**
     * @type {{
     *     twoFactor: string,
     *     onCancel: () => void,
     *     onSubmit: () => void,
     * }}
    */
    let { twoFactor = $bindable(), onCancel, onSubmit } = $props();
</script>

<div transition:fade={{ duration: 150 }} class="modal-wrapper grey-zone" aria-hidden="true" onclick={onCancel}>
    <dialog open onclick={e => e.stopPropagation()}>
        <header>
            Enter OTP
            <button class="btn btn-small" onclick={onCancel}>
                <X class="full"/>
            </button>
        </header>
        <form onsubmit={e => {
            e.preventDefault();
            onSubmit();
        }}>
            <article>
                <div>
                    <label class="inline" for="two-factor">2FA Pin</label>
                    <input
                        bind:value={twoFactor} type="text" name="two-factor" id="two-factor"
                        placeholder="••••••" autocomplete="one-time-code webauthn" class="two-factor"
                        required minlength="6" maxlength="6" pattern="[0-9]{'{6}'}"
                    >
                </div>
            </article>
            <footer>
                <button class="btn btn-outline btn-dark btn-center w-full">
                    Reset Password
                </button>
            </footer>
        </form>
    </dialog>
</div>
