<script lang="ts">
	import '../app.css';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { auth } from '$lib/auth.svelte';
	import { LayoutDashboard, Users, FileText, BookOpen, PenLine, LogOut } from 'lucide-svelte';
	import type { Snippet } from 'svelte';

	let { children }: { children: Snippet } = $props();
	const path = $derived(page.url.pathname);
	const isLogin = $derived(path === '/login');

	$effect(() => { if (!isLogin && !auth.ok) goto('/login'); });

	const nav = [
		{ href: '/',        label: 'Dashboard', icon: LayoutDashboard },
		{ href: '/users',   label: 'Users',      icon: Users },
		{ href: '/exams',   label: 'Exams',      icon: FileText },
		{ href: '/vocab',   label: 'Vocabulary', icon: BookOpen },
		{ href: '/grammar', label: 'Grammar',    icon: PenLine },
	];
</script>

{#if isLogin}
	{@render children()}
{:else if auth.ok}
	<div class="flex h-screen overflow-hidden bg-(--color-bg)">
		<aside class="w-[220px] shrink-0 flex flex-col border-r border-(--color-border)">

			<!-- Workspace -->
			<div class="px-3 pt-3 pb-2">
				<a href="/" class="flex items-center gap-[9px] px-[9px] py-[6px] rounded-[4px] no-underline hover:bg-(--color-hover) transition-colors">
					<span class="flex items-center justify-center w-[18px] h-[18px] rounded-[4px] bg-[#978200] text-[11px] text-(--color-text) shrink-0 leading-[1.1]">VS</span>
					<span class="text-[13px] font-medium text-(--color-text) whitespace-nowrap">VSTEP Admin</span>
				</a>
			</div>

			<!-- Nav -->
			<nav class="flex-1 px-3 py-1 flex flex-col gap-[1px] overflow-y-auto">
				{#each nav as item}
					{@const active = path === item.href}
					<a
						href={item.href}
						class="flex items-center gap-[10px] pl-[7px] pr-[2px] py-[5.5px] rounded-[4px] text-[13px] no-underline transition-colors
							{active ? 'bg-(--color-selected) text-(--color-text-secondary) font-medium' : 'text-(--color-text-tertiary) hover:bg-(--color-hover) hover:text-(--color-text-secondary)'}"
					>
						<item.icon size={16} strokeWidth={1.75} />
						{item.label}
					</a>
				{/each}
			</nav>

			<!-- Footer -->
			<div class="px-3 py-2 border-t border-(--color-border)">
				<button
					class="flex items-center gap-[10px] w-full pl-[7px] pr-[2px] py-[5.5px] rounded-[4px] text-[13px] text-(--color-text-tertiary) hover:bg-(--color-hover) hover:text-(--color-text-secondary) transition-colors text-left"
					onclick={() => { auth.logout(); goto('/login'); }}
				>
					<LogOut size={16} strokeWidth={1.75} />
					Sign out
				</button>
			</div>
		</aside>

		<main class="flex-1 overflow-y-auto bg-(--color-bg)">
			{@render children()}
		</main>
	</div>
{/if}
