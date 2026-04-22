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

<div class="min-h-screen flex items-center justify-center" style="background: #1d1e2b;">
	<div class="w-full max-w-[320px] space-y-6">
		<div>
			<p class="text-[13px]" style="color: #858699;">VSTEP Admin</p>
			<h1 class="text-[20px] font-medium mt-1" style="color: #eeeffc;">Sign in</h1>
		</div>

		<form onsubmit={(e) => { e.preventDefault(); login(); }} class="space-y-3">
			<div class="space-y-1.5">
				<label class="text-[12px]" style="color: #858699;" for="email">Email</label>
				<input id="email" type="email" class="input" bind:value={email} required autocomplete="email" />
			</div>
			<div class="space-y-1.5">
				<label class="text-[12px]" style="color: #858699;" for="password">Password</label>
				<input id="password" type="password" class="input" bind:value={password} required autocomplete="current-password" />
			</div>

			{#if error}
				<p class="text-[12px]" style="color: #ef4444;">{error}</p>
			{/if}

			<button type="submit" class="btn btn-primary w-full justify-center mt-1" disabled={loading}>
				{loading ? 'Signing in…' : 'Continue'}
			</button>
		</form>
	</div>
</div>
