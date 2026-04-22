<script lang="ts">
	import { auth } from '$lib/auth.svelte';
</script>

<div class="p-8 space-y-6">
	<div>
		<h1 class="text-2xl font-semibold text-(--color-foreground)">Dashboard</h1>
		<p class="text-sm text-(--color-muted) mt-1">Welcome back, {auth.user?.full_name}</p>
	</div>

	<div class="grid grid-cols-4 gap-4">
		<div class="card p-5 space-y-1">
			<p class="text-xs font-medium text-(--color-muted)">Total Users</p>
			<p class="text-2xl font-semibold text-(--color-foreground)">—</p>
		</div>
		<div class="card p-5 space-y-1">
			<p class="text-xs font-medium text-(--color-muted)">Active Exams</p>
			<p class="text-2xl font-semibold text-(--color-foreground)">—</p>
		</div>
		<div class="card p-5 space-y-1">
			<p class="text-xs font-medium text-(--color-muted)">Vocab Topics</p>
			<p class="text-2xl font-semibold text-(--color-foreground)">—</p>
		</div>
		<div class="card p-5 space-y-1">
			<p class="text-xs font-medium text-(--color-muted)">Grammar Points</p>
			<p class="text-2xl font-semibold text-(--color-foreground)">—</p>
		</div>
	</div>
</div>
