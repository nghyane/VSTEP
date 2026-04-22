<script lang="ts">
	import { auth } from '$lib/auth.svelte';
</script>

<div class="p-8 space-y-6">
	<div>
		<h1 class="text-[16px] font-medium" style="color: #eeeffc;">Dashboard</h1>
		<p class="text-[13px] mt-0.5" style="color: #858699;">Welcome back, {auth.user?.full_name}</p>
	</div>

	<div class="grid grid-cols-4 gap-3">
		{#each ['Total Users', 'Active Exams', 'Vocab Topics', 'Grammar Points'] as label}
			<div class="card p-4 space-y-2">
				<p class="text-[12px]" style="color: #858699;">{label}</p>
				<p class="text-[22px] font-medium" style="color: #eeeffc;">—</p>
			</div>
		{/each}
	</div>
</div>
