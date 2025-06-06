<script>
    import { X } from "@lucide/svelte";
    import { fade } from "svelte/transition";
    import qrcode from 'qrcode';
    import Spinner from "../Spinner.svelte";
    import { LoginRequestSchema, RegisterRequestSchema } from "common";
    import { login, register } from "../../util/auth";
    import { z } from "zod/v4";

    /**
     * @param {MouseEvent | KeyboardEvent} e
     */
    const tryClose = (e) => {
        if (e instanceof KeyboardEvent && e.key != 'Escape') {
            return;
        }
        if (!registrationPromise) {
            close();
        }
    };

    const performRegisteration = async () => {
        registrationErrors = null;
        
        if (password.trim() != passwordConfirm.trim()) {
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
            registrationErrors = z.treeifyError(request.error);
            return;
        }

        const result = await register(request.data);

        if (!result) {
            registrationErrors = {
                errors: ['Failed to register.'],
            };
            return;
        }
        
        if ('err' in result) {
            registrationErrors = /** @type {import('zod/v4/core').$ZodErrorTree<import('common').RegisterRequest>} */(
                result.err.data
            );
            return;
        }
            
        return await qrcode.toDataURL(result.ok, {
            color: {
                dark: '#000',
                light: '#fff0',
            },
            margin: 0,
            width: 512,
        });
    };

    const performLogin = async () => {
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
    let passwordConfirm = $state("");
    let name = $state("");
    let twoFactor = $state("");
    
    /** @type {Promise<string | undefined> | null} */
    let registrationPromise = $state(null);
    /** @type {import('zod/v4/core').$ZodErrorTree<import('common').RegisterRequest> | null} */
    let registrationErrors = $state(null);
    
    /** @type {Promise<void> | null} */
    let loginPromise = $state(null);
    /** @type {import('zod/v4/core').$ZodErrorTree<import('common').LoginRequest> | null} */
    let loginErrors = $state(null);
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

<div transition:fade={{ duration: 150 }} class="modal-wrapper grey-zone" aria-hidden="true" onclick={tryClose} onkeydown={tryClose}>
    <dialog open onclick={e => e.stopPropagation()}>
        {#if registrationPromise}
            {#await registrationPromise}
                <header class="text-center">
                    Register
                </header>
                <article>
                    <div class="loader-wrapper">
                        <Spinner/>
                    </div>
                </article>
                <footer>
                    <button class="btn btn-outline btn-dark btn-center w-full" disabled>
                        <Spinner/>
                    </button>
                </footer>
            {:then qrCode}
                <header class="text-center">
                    Scan This!
                </header>
                <form onsubmit={e => { e.preventDefault(); loginPromise = performLogin().then(() => { loginPromise = null }); }}>
                    <article>
                        <img src={qrCode} alt="QR Code">
                        <small>
                            <p>
                                If you do not register your account with a two-factor authentication app. You will not be able to sign in.
                            </p>
                        </small>
                        <div>
                            <label class="inline" for="two-factor">2FA Pin</label>
                            <input
                                bind:value={twoFactor} type="text" name="two-factor" id="two-factor"
                                placeholder="••••••" autocomplete="one-time-code webauthn" class="two-factor"
                                required minlength="6" maxlength="6" pattern="[0-9]{'{6}'}"
                            >
                            {#if loginErrors?.errors?.at(0)}
                                <p class="error">{loginErrors.errors[0]}</p>
                            {/if}
                            {#if loginErrors?.properties?.email?.errors?.at(0)}
                                <p class="error">{loginErrors.properties.email.errors[0]}</p>
                            {/if}
                            {#if loginErrors?.properties?.password?.errors?.at(0)}
                                <p class="error">{loginErrors.properties.password.errors[0]}</p>
                            {/if}
                            {#if loginErrors?.properties?.twoFactor?.errors?.at(0)}
                                <p class="error">{loginErrors.properties.twoFactor.errors[0]}</p>
                            {/if}
                        </div>
                    </article>
                    <footer>
                        {#await loginPromise}
                            <button class="btn btn-outline btn-dark btn-center w-full" disabled>
                                <Spinner/>
                            </button>
                        {:then}
                            <button class="btn btn-outline btn-dark btn-center w-full">
                                Got it!
                            </button>
                        {/await}
                    </footer>
                </form>
            {/await}
        {:else}
            <header>
                Register
                <button class="btn btn-small" onclick={close}>
                    <X class="full"/>
                </button>
            </header>
            <form onsubmit={e => { e.preventDefault(); registrationPromise = performRegisteration().then(res => { if (res) return res; else registrationPromise = null; }) }}>
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
                            <p class="error">{registrationErrors.properties.email.errors[0]}</p>
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
                            <p class="error">{registrationErrors.properties.name.errors[0]}</p>
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
                            <p class="error">{registrationErrors.properties.password.errors[0]}</p>
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
