<script>
    import { Eye, EyeOff, X } from "@lucide/svelte";
    import { fade } from "svelte/transition";
    import qrcode from 'qrcode';
    import Spinner from "../Spinner.svelte";
    import { LoginRequestSchema, RegisterRequestSchema } from "common";
    import { checkAuth, login, pwnedPasswordCount, register } from "../../util/auth";
    import { z } from "zod/v4";
    import { ApiError } from "../../util/http";

    const tryClose = () => {
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

        try {
            const totpUri = await register(request.data);
            
            return await qrcode.toDataURL(totpUri, {
                color: {
                    dark: '#000',
                    light: '#fff0',
                },
                margin: 0,
                width: 512,
            });
        } catch (err) {
            if (err instanceof ApiError && err.errorResponse.code === 'validation_error') {
                registrationErrors = /** @type {import('zod/v4/core').$ZodErrorTree<import('common').RegisterRequest>} */(
                    err.errorResponse.data
                );
            } else {
                registrationErrors = {
                    errors: ['Failed to register.'],
                };
            }
        }
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

        try {
            await login(request.data);
            await checkAuth();
            close();
        } catch (err) {
            if (err instanceof ApiError && err.errorResponse.code === 'validation_error') {
                loginErrors = /** @type {import('zod/v4/core').$ZodErrorTree<import('common').LoginRequest>} */(
                    err.errorResponse.data
                );
            } else {
                loginErrors = {
                    errors: ['Failed to sign in.'],
                };
            }
        }
    };

    /** @type {{ close: () => void }} */
    let { close } = $props();

    let email = $state("");
    let password = $state("");
    let passwordConfirm = $state("");
    let name = $state("");
    let twoFactor = $state("");
    
    let showPassword = $state(false);

    let pwnedPasswords = $derived(pwnedPasswordCount(password));
    
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

    .password-warning {
        margin-bottom: 1rem;
    }

    .password-wrapper {
        position: relative;

        input {
            padding-right: 2rem;
        }
    }

    .checking-password {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.75rem;
        color: #666;
        margin-bottom: 1rem;

        :global(svg) {
            font-size: 1rem;
        }
    }

    .show-password-button {
        position: absolute;
        right: 0.5rem;
        top: 50%;
        transform: translateY(-50%);
    }
</style>

<div transition:fade={{ duration: 150 }} class="modal-wrapper grey-zone" aria-hidden="true" onclick={tryClose}>
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
                    <div class="password-wrapper">
                        <label class="inline" for="password">Password</label>
                        <input
                            bind:value={password} type={showPassword ? 'text' : 'password'} name="password" id="password"
                            placeholder="" autocomplete="new-password webauthn"
                            required minlength="12" maxlength="128"
                        >
                        {#if registrationErrors?.properties?.password?.errors?.at(0)}
                            <p class="error">{registrationErrors.properties.password.errors[0]}</p>
                        {/if}
                        <button type="button" class="show-password-button" onclick={(e) => {
                            e.preventDefault();
                            showPassword = !showPassword;
                        }}>
                            {#if showPassword}
                                <EyeOff/>
                            {:else}
                                <Eye/>
                            {/if}
                        </button>
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
                    {#await pwnedPasswords}
                        <p class="checking-password">
                            <Spinner/>
                            Checking password...
                        </p>
                        <button class="btn btn-outline btn-dark btn-center w-full" disabled>
                            Register
                        </button>
                    {:then count}
                        {#if count > 0}
                            <p class="error password-warning">
                                This password is not secure! It has been detected in
                                {#if count == 1}
                                    a data breach!
                                {:else}
                                    {count} data breaches!
                                {/if}
                            </p>
                            <button class="btn btn-outline btn-dark btn-center w-full" disabled>
                                Register
                            </button>
                        {:else}
                            <button class="btn btn-outline btn-dark btn-center w-full">
                                Register
                            </button>
                        {/if}
                    {/await}
                </footer>
            </form>
        {/if}
    </dialog>
</div>
