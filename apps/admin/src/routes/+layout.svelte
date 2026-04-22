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
		{ href: '/',        label: 'Dashboard' },
		{ href: '/users',   label: 'Users' },
		{ href: '/exams',   label: 'Exams' },
		{ href: '/vocab',   label: 'Vocabulary' },
		{ href: '/grammar', label: 'Grammar' },
	];
</script>

{#if isLoginPage}
	{@render children()}
{:else if auth.isAuthenticated}
	<div class="flex h-screen overflow-hidden" style="background: #1d1e2b;">
		<!-- Sidebar — Linear style -->
		<aside class="w-[220px] flex-shrink-0 flex flex-col" style="background: #1d1e2b; border-right: 1px solid #292a35;">

			<!-- Workspace header -->
			<div class="flex items-center gap-[9px] px-[9px] py-[6px] mt-2 mx-2 rounded-[4px] cursor-pointer hover:bg-[rgba(133,134,152,0.1)] transition-colors">
				<div class="flex items-center justify-center rounded-[4px] size-[18px] shrink-0" style="background: #978200;">
					<span class="text-[11px] font-normal leading-[1.1]" style="color: #eeeffc;">VS</span>
				</div>
				<span class="text-[13px] font-medium whitespace-nowrap" style="color: #eeeffc;">VSTEP Admin</span>
			</div>

			<!-- Nav -->
			<nav class="flex-1 px-2 py-2 space-y-0.5 overflow-y-auto mt-2">
				{#each nav as item}
					<a
						href={item.href}
						class="flex items-center gap-[10px] px-[8px] py-[4.5px] rounded-[4px] text-[13px] transition-colors"
						style={page.url.pathname === item.href
							? 'background: rgba(133,134,152,0.2); color: #d2d3e0;'
							: 'color: #858699;'}
						onmouseenter={(e) => { if (page.url.pathname !== item.href) (e.currentTarget as HTMLElement).style.background = 'rgba(133,134,152,0.1)'; (e.currentTarget as HTMLElement).style.color = '#d2d3e0'; }}
						onmouseleave={(e) => { if (page.url.pathname !== item.href) { (e.currentTarget as HTMLElement).style.background = ''; (e.currentTarget as HTMLElement).style.color = '#858699'; } }}
					>
						{item.label}
					</a>
				{/each}
			</nav>

			<!-- Bottom -->
			<div class="px-2 py-3 space-y-0.5" style="border-top: 1px solid #292a35;">
				<button
					class="flex items-center gap-[9px] w-full px-[8px] py-[4.5px] rounded-[4px] text-[13px] transition-colors text-left"
					style="color: #858699;"
					onmouseenter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(133,134,152,0.1)'; (e.currentTarget as HTMLElement).style.color = '#d2d3e0'; }}
					onmouseleave={(e) => { (e.currentTarget as HTMLElement).style.background = ''; (e.currentTarget as HTMLElement).style.color = '#858699'; }}
					onclick={() => { auth.clear(); goto('/login'); }}
				>
					Sign out
				</button>
			</div>
		</aside>

		<!-- Content -->
		<main class="flex-1 overflow-y-auto" style="background: #1d1e2b;">
			{@render children()}
		</main>
	</div>
{/if}
