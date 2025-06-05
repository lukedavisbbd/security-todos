<script>
    import { X } from "@lucide/svelte";
    import { fade } from "svelte/transition";
    import qrcode from 'qrcode';
    import Spinner from "../Spinner.svelte";
    import { RegisterRequestSchema } from "common";
    import { register } from "../../util/auth";
    import { z } from "zod/v4";

    const performRegisteration = async () => {
        registrationErrors = null;
        
        if (password.trim() != passwordConfirm.trim()) {
            registrationPromise = null;
            registrationErrors = {
                errors: [],
                properties: {
                    password: {
                        errors: ['Passwords do not match!'],
                    }
                },
            };
            return;
        }

        const request = RegisterRequestSchema.safeParse({
            email,
            password,
            name,
        });

        if (request.error) {
            registrationPromise = null;
            registrationErrors = z.treeifyError(request.error);
            return;
        }

        const result = await register(request.data);

        if (!result) {
            registrationPromise = null;
            registrationErrors = {
                errors: ['Failed to register.'],
            };
            return;
        }
        
        if ('ok' in result) {
            return await qrcode.toDataURL(result.ok.totpUri, {
                color: {
                    dark: '#000',
                    light: '#fff0',
                },
                margin: 0,
                width: 512,
            });
        } else {
            registrationPromise = null;
            registrationErrors = /** @type {import('zod/v4/core').$ZodErrorTree<import('common').RegisterRequest>} */(
                result.err.data
            );
        }
    };

    /** @type {{ close: () => void }} */
    let { close } = $props();

    let email = $state("");
    let password = $state("");
    let passwordConfirm = $state("");
    let name = $state("");
    
    /** @type {Promise<string | undefined> | null} */
    let registrationPromise = $state(null);
    /** @type {import('zod/v4/core').$ZodErrorTree<import('common').RegisterRequest> | null} */
    let registrationErrors = $state(null);

    /** @type {HTMLFormElement} */
    // svelte-ignore non_reactive_update
    let form;
</script>

<style>
    img {
        display: block;
        margin: 0 auto 0.75rem auto;
        width: 100%;
        max-width: 12rem;
        aspect-ratio: 1;
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
</style>

<div transition:fade={{ duration: 150 }} class="modal-wrapper grey-zone" aria-hidden="true" onclick={() => { if (!registrationPromise) { close() } }}>
    <dialog open onclick={e => e.stopPropagation()}>
        {#if registrationPromise && !registrationErrors}
            <header class="text-center">
                Scan This!
            </header>
            {#await registrationPromise}
                <article>
                    <div class="loader-wrapper">
                        <Spinner/>
                    </div>
                    <small>
                        <p>
                            If you do not register your account with a two-factor authentication app, you will not be able to sign in.
                        </p>
                    </small>
                </article>
                <footer>
                    <button class="btn btn-outline btn-dark btn-center w-full" disabled>
                        <Spinner/>
                    </button>
                </footer>
            {:then qrCode}
                <article>
                    <img src={qrCode} alt="QR Code">
                    <small>
                        <p>
                            If you do not register your account with a two-factor authentication app. You will not be able to sign in.
                        </p>
                    </small>
                </article>
                <footer>
                    <button class="btn btn-outline btn-dark btn-center w-full" onclick={close}>
                        Got it!
                    </button>
                </footer>
            {/await}
        {:else}
            <header>
                Register
                <button class="btn btn-small" onclick={close}>
                    <X class="full"/>
                </button>
            </header>
            <form bind:this={form} onsubmit={e => { e.preventDefault(); registrationPromise = performRegisteration() }}>
                <article>
                    {#if registrationErrors?.errors?.at(0)}
                        <p class="error">{registrationErrors.errors[0]}</p>
                    {/if}
                    <div>
                        <label class="inline" for="email">Email Address</label>
                        <input
                            bind:value={email} type="email" name="email" id="email"
                            placeholder="" autocomplete="email webauthn"
                            required maxlength="128"
                        >
                        {#if registrationErrors?.properties?.email?.errors?.at(0)}
                            <p class="error">{registrationErrors.properties.email.errors.at[0]}</p>
                        {/if}
                    </div>
                    <div>
                        <label class="inline" for="name">Name</label>
                        <input
                            bind:value={name} type="text" name="name" id="name"
                            placeholder="" autocomplete="name webauthn"
                            required maxlength="64"
                        >
                        {#if registrationErrors?.properties?.name?.errors?.at(0)}
                            <p class="error">{registrationErrors.properties.name.errors.at[0]}</p>
                        {/if}
                    </div>
                    <div>
                        <label class="inline" for="password">Password</label>
                        <input
                            bind:value={password} type="password" name="password" id="password"
                            placeholder="" autocomplete="new-password webauthn"
                            required minlength="12" maxlength="128"
                        >
                        {#if registrationErrors?.properties?.password?.errors?.at(0)}
                            <p class="error">{registrationErrors.properties.password.errors.at[0]}</p>
                        {/if}
                    </div>
                    <div>
                        <label class="inline" for="password-confirm">Confirm Password</label>
                        <input
                            bind:value={passwordConfirm} type="password" name="password-confirm" id="password-confirm"
                            placeholder="" autocomplete="new-password webauthn"
                            required minlength="12" maxlength="128"
                        >
                    </div>
                </article>
                <footer>
                    <button class="btn btn-outline btn-dark btn-center w-full">
                        Register
                    </button>
                </footer>
            </form>
        {/if}
    </dialog>
</div>
