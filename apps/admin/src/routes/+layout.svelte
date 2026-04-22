<script lang="ts">
	import '../app.css';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { auth } from '$lib/auth.svelte';
	import { LayoutDashboard, Users, FileText, BookOpen, PenLine, LogOut } from 'lucide-svelte';
	import type { Snippet } from 'svelte';

	let { children }: { children: Snippet } = $props();

	const isLoginPage = $derived(page.url.pathname === '/login');

	$effect(() => {
		if (!isLoginPage && !auth.isAuthenticated) goto('/login');
	});

	const nav = [
		{ href: '/',        label: 'Dashboard', icon: LayoutDashboard },
		{ href: '/users',   label: 'Users',      icon: Users },
		{ href: '/exams',   label: 'Exams',      icon: FileText },
		{ href: '/vocab',   label: 'Vocabulary', icon: BookOpen },
		{ href: '/grammar', label: 'Grammar',    icon: PenLine },
	];
</script>

{#if isLoginPage}
	{@render children()}
{:else if auth.isAuthenticated}
	<div class="flex h-screen overflow-hidden" style="background: var(--color-background);">
		<aside class="w-[220px] shrink-0 flex flex-col" style="background: var(--color-sidebar-bg); border-right: 1px solid var(--color-sidebar-border);">

			<!-- Workspace -->
			<div class="p-2" style="border-bottom: 1px solid var(--color-sidebar-border);">
				<a href="/" class="flex items-center gap-[9px] px-[9px] py-[6px] rounded-[4px] no-underline hover:bg-[rgba(133,134,152,0.1)] transition-colors">
					<span class="flex items-center justify-center w-[18px] h-[18px] rounded-[4px] text-[11px] shrink-0" style="background: #978200; color: #eeeffc;">VS</span>
					<span class="text-[13px] font-medium whitespace-nowrap" style="color: var(--color-foreground);">VSTEP Admin</span>
				</a>
			</div>

			<!-- Nav -->
			<nav class="flex-1 p-2 flex flex-col gap-px overflow-y-auto">
				{#each nav as item}
					<a href={item.href} class="nav-item" class:active={page.url.pathname === item.href}>
						<item.icon size={16} strokeWidth={1.75} />
						{item.label}
					</a>
				{/each}
			</nav>

			<!-- Footer -->
			<div class="p-2" style="border-top: 1px solid var(--color-sidebar-border);">
				<button class="nav-item w-full" onclick={() => { auth.clear(); goto('/login'); }}>
					<LogOut size={16} strokeWidth={1.75} />
					Sign out
				</button>
			</div>
		</aside>

		<main class="flex-1 overflow-y-auto" style="background: var(--color-background);">
			{@render children()}
		</main>
	</div>
{/if}
