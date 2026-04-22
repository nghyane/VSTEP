<script lang="ts">
	import { auth } from '$lib/auth.svelte';
</script>

<div class="px-8 py-6">
	<div class="mb-6">
		<h1 class="text-[16px] font-medium text-(--color-text)">Dashboard</h1>
		<p class="text-[13px] text-(--color-text-tertiary) mt-1">Welcome, {auth.user?.full_name}</p>
	</div>

	<div class="grid grid-cols-4 gap-3">
		{#each [
			{ label: 'Total Users', value: '—' },
			{ label: 'Active Exams', value: '3' },
			{ label: 'Vocab Topics', value: '12' },
			{ label: 'Grammar Points', value: '10' },
		] as stat}
			<div class="bg-(--color-surface) border border-(--color-border) rounded-[4px] p-4">
				<p class="text-[12px] text-(--color-text-tertiary) mb-1">{stat.label}</p>
				<p class="text-[20px] font-medium text-(--color-text)">{stat.value}</p>
			</div>
		{/each}
	</div>
</div>
