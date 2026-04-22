<script lang="ts">
	import { auth } from '$lib/auth.svelte';
</script>

<div class="p-6 space-y-5">
	<div>
		<h1 class="text-[16px] font-semibold">Dashboard</h1>
		<p class="text-[13px] text-(--color-text-tertiary) mt-0.5">Welcome, {auth.user?.full_name}</p>
	</div>

	<div class="grid grid-cols-4 gap-3">
		{#each ['Total Users', 'Active Exams', 'Vocab Topics', 'Grammar Points'] as label}
			<div class="bg-(--color-surface) border border-(--color-border) rounded-(--radius) p-4 space-y-2">
				<p class="text-[12px] text-(--color-text-tertiary)">{label}</p>
				<p class="text-[22px] font-semibold">—</p>
			</div>
		{/each}
	</div>
</div>
