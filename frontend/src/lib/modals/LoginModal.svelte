<script>
    import { X } from "@lucide/svelte";
    import { fade } from "svelte/transition";
    import Spinner from "../Spinner.svelte";
    import { LoginRequestSchema } from "common";
    import { login } from "../../util/auth";
    import { z } from "zod/v4";

    /**
     * @param {MouseEvent | KeyboardEvent} e
     */
    const tryClose = (e) => {
        if (e instanceof KeyboardEvent && e.key != 'Escape') {
            return;
        }
        if (!loginPromise) {
            close();
        }
    };

    const performLogin = async () => {
        enterTwoFactor = false;
        loginErrors = null;
        
        const request = LoginRequestSchema.safeParse({
            email,
            password,
            twoFactor,
        });

        if (request.error) {
            loginErrors = z.treeifyError(request.error);
            return;
        }

        const result = await login(request.data);

        if (!result) {
            loginErrors = {
                errors: ['Failed to sign in.'],
            };
            return;
        }
        
        if ('ok' in result) {
            close();
        } else {
            loginErrors = /** @type {import('zod/v4/core').$ZodErrorTree<import('common').LoginRequest>} */(
                result.err.data
            );
        }
    };

    /** @type {{ close: () => void }} */
    let { close } = $props();

    let email = $state("");
    let password = $state("");
    let twoFactor = $state("");

    let enterTwoFactor = $state(false);
    
    /** @type {Promise<void> | null} */
    let loginPromise = $state(null);
    /** @type {import('zod/v4/core').$ZodErrorTree<import('common').LoginRequest> | null} */
    let loginErrors = $state(null);

    /** @type {HTMLFormElement} */
    // svelte-ignore non_reactive_update
    let form;
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

<div transition:fade={{ duration: 150 }} class="modal-wrapper grey-zone" aria-hidden="true">
    <dialog open onclick={e => e.stopPropagation()}>
        {#if loginPromise}
            <article>
                <div class="loader-wrapper">
                    <Spinner/>
                </div>
            </article>
        {:else}
            <header>
                Sign In
                <button class="btn btn-small" onclick={close}>
                    <X class="full"/>
                </button>
            </header>
            <form bind:this={form} onsubmit={e => {
                e.preventDefault();
                if (!enterTwoFactor) {
                    const request = LoginRequestSchema.safeParse({
                        email,
                        password,
                        twoFactor: '000000',
                    });

                    if (request.error) {
                        loginErrors = z.treeifyError(request.error);
                        return;
                    }
                    
                    enterTwoFactor = true;
                    return;
                }
                loginPromise = performLogin().then(() => {
                    loginPromise = null;
                });
            }}>
                <article>
                    {#if enterTwoFactor}
                        <div>
                            <label class="inline" for="two-factor">2FA Pin</label>
                            <input
                                bind:value={twoFactor} type="text" name="two-factor" id="two-factor"
                                placeholder="••••••" autocomplete="one-time-code webauthn" class="two-factor"
                                required minlength="6" maxlength="6" pattern="[0-9]{'{6}'}"
                            >
                            {#if loginErrors?.properties?.twoFactor?.errors?.at(0)}
                                <p class="error">{loginErrors.properties.twoFactor.errors[0]}</p>
                            {/if}
                        </div>
                    {:else}
                        {#if loginErrors?.errors?.at(0)}
                            <p class="error">{loginErrors.errors[0]}</p>
                        {/if}
                        <div>
                            <label class="inline" for="email">Email Address</label>
                            <input
                                bind:value={email} type="email" name="email" id="email"
                                placeholder="" autocomplete="email webauthn"
                                required maxlength="128"
                            >
                            {#if loginErrors?.properties?.email?.errors?.at(0)}
                                <p class="error">{loginErrors.properties.email.errors[0]}</p>
                            {/if}
                        </div>
                        <div>
                            <label class="inline" for="password">Password</label>
                            <input
                                bind:value={password} type="password" name="password" id="password"
                                placeholder="" autocomplete="new-password webauthn"
                                required maxlength="128"
                            >
                            {#if loginErrors?.properties?.password?.errors?.at(0)}
                                <p class="error">{loginErrors.properties.password.errors[0]}</p>
                            {/if}
                        </div>
                    {/if}
                </article>
                <footer>
                    <button class="btn btn-outline btn-dark btn-center w-full">
                        Sign In
                    </button>
                </footer>
            </form>
        {/if}
    </dialog>
</div>
