<script lang="ts">
	import { goto } from '$app/navigation';
	import { api } from '$lib/api';
	import { auth } from '$lib/auth.svelte';

	let email = $state('');
	let password = $state('');
	let error = $state('');
	let loading = $state(false);

	async function login() {
		error = '';
		loading = true;
		try {
			const res = await api<{ data: { access_token: string; user: { id: string; email: string; full_name: string; role: string } } }>(
				'/api/v1/auth/login',
				{ method: 'POST', body: JSON.stringify({ email, password }) }
			);
			const { access_token, user } = res.data;
			if (user.role !== 'admin' && user.role !== 'staff') {
				error = 'Access denied. Admin or staff only.';
				return;
			}
			auth.set(access_token, user);
			goto('/');
		} catch (e) {
			error = e instanceof Error ? e.message : 'Login failed';
		} finally {
			loading = false;
		}
	}
</script>

<div class="min-h-screen flex items-center justify-center bg-(--color-background)">
	<div class="card w-full max-w-sm p-8 space-y-6">
		<div>
			<h1 class="text-xl font-semibold text-(--color-foreground)">VSTEP Admin</h1>
			<p class="text-sm text-(--color-muted) mt-1">Sign in to continue</p>
		</div>

		<form onsubmit={(e) => { e.preventDefault(); login(); }} class="space-y-4">
			<div class="space-y-1">
				<label class="text-xs font-medium text-(--color-muted)" for="email">Email</label>
				<input id="email" type="email" class="input" bind:value={email} required autocomplete="email" />
			</div>
			<div class="space-y-1">
				<label class="text-xs font-medium text-(--color-muted)" for="password">Password</label>
				<input id="password" type="password" class="input" bind:value={password} required autocomplete="current-password" />
			</div>

			{#if error}
				<p class="text-xs text-(--color-destructive)">{error}</p>
			{/if}

			<button type="submit" class="btn btn-primary w-full justify-center" disabled={loading}>
				{loading ? 'Signing in…' : 'Sign in'}
			</button>
		</form>
	</div>
</div>
