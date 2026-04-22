<script lang="ts">
	import { goto } from '$app/navigation';
	import { api } from '$lib/api';
	import { auth } from '$lib/auth.svelte';

	let email = $state('');
	let password = $state('');
	let error = $state('');
	let busy = $state(false);

	async function submit() {
		error = '';
		busy = true;
		try {
			const { data } = await api<{ data: { access_token: string; user: { id: string; email: string; full_name: string; role: string } } }>(
				'/api/v1/auth/login',
				{ method: 'POST', body: JSON.stringify({ email, password }) }
			);
			if (data.user.role !== 'admin' && data.user.role !== 'staff') {
				error = 'Admin or staff only.';
				return;
			}
			auth.login(data.access_token, data.user);
			goto('/');
		} catch (e: unknown) {
			error = e instanceof Error ? e.message : 'Login failed';
		} finally {
			busy = false;
		}
	}
</script>

<div class="min-h-screen flex items-center justify-center">
	<div class="w-80 space-y-5">
		<div>
			<p class="text-[12px] text-(--color-text-tertiary)">VSTEP Admin</p>
			<h1 class="text-[20px] font-semibold mt-1">Sign in</h1>
		</div>

		<form onsubmit={(e) => { e.preventDefault(); submit(); }} class="space-y-3">
			<input type="email" placeholder="Email" class="w-full bg-(--color-surface) border border-(--color-border) rounded-(--radius) px-2.5 py-1.5 text-[13px] text-(--color-text) placeholder:text-(--color-text-dim) outline-none focus:border-(--color-primary)" bind:value={email} required />
			<input type="password" placeholder="Password" class="w-full bg-(--color-surface) border border-(--color-border) rounded-(--radius) px-2.5 py-1.5 text-[13px] text-(--color-text) placeholder:text-(--color-text-dim) outline-none focus:border-(--color-primary)" bind:value={password} required />

			{#if error}
				<p class="text-[12px] text-(--color-destructive)">{error}</p>
			{/if}

			<button type="submit" class="w-full bg-(--color-primary) hover:bg-(--color-primary-hover) text-(--color-primary-fg) rounded-(--radius) px-3 py-1.5 text-[13px] font-medium transition-colors disabled:opacity-40" disabled={busy}>
				{busy ? 'Signing in…' : 'Continue'}
			</button>
		</form>
	</div>
</div>
