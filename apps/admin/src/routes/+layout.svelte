<script lang="ts">
	import '../app.css';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { auth } from '$lib/auth.svelte';
	import type { Snippet } from 'svelte';

	let { children }: { children: Snippet } = $props();

	const isLoginPage = $derived(page.url.pathname === '/login');

	$effect(() => {
		if (!isLoginPage && !auth.isAuthenticated) goto('/login');
	});

	const nav = [
		{ href: '/',        label: 'Dashboard',  icon: '▦' },
		{ href: '/users',   label: 'Users',       icon: '👤' },
		{ href: '/exams',   label: 'Exams',       icon: '📝' },
		{ href: '/vocab',   label: 'Vocabulary',  icon: '📚' },
		{ href: '/grammar', label: 'Grammar',     icon: '✏️' },
	];
</script>

{#if isLoginPage}
	{@render children()}
{:else if auth.isAuthenticated}
	<div class="flex h-screen overflow-hidden">
		<!-- Sidebar -->
		<aside class="w-60 flex-shrink-0 flex flex-col bg-(--color-sidebar-bg) border-r border-(--color-sidebar-border)">
			<div class="px-5 py-4 border-b border-(--color-sidebar-border)">
				<span class="text-sm font-semibold text-(--color-sidebar-fg)">VSTEP Admin</span>
			</div>

			<nav class="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
				{#each nav as item}
					<a
						href={item.href}
						class="flex items-center gap-2.5 px-3 py-2 rounded-(--radius-md) text-sm transition-colors
							{page.url.pathname === item.href
								? 'bg-(--color-sidebar-active-bg) text-(--color-sidebar-active) font-medium'
								: 'text-(--color-sidebar-muted) hover:text-(--color-sidebar-fg) hover:bg-white/5'}"
					>
						<span class="text-base leading-none">{item.icon}</span>
						{item.label}
					</a>
				{/each}
			</nav>

			<div class="px-3 py-3 border-t border-(--color-sidebar-border)">
				<button
					class="flex items-center gap-2 w-full px-3 py-2 rounded-(--radius-md) text-sm text-(--color-sidebar-muted) hover:text-(--color-sidebar-fg) hover:bg-white/5 transition-colors"
					onclick={() => { auth.clear(); goto('/login'); }}
				>
					<span>↩</span> Sign out
				</button>
			</div>
		</aside>

		<!-- Content -->
		<main class="flex-1 overflow-y-auto bg-(--color-background)">
			{@render children()}
		</main>
	</div>
{/if}
