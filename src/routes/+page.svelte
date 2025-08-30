<script lang="ts">
	import { signIn, useSession } from '$lib/auth-client';
	import { onMount } from 'svelte';
	import {
		cmdOut,
		processCommand,
		waitingForInput,
		submitInput,
		navigateHistory
	} from './lib.svelte';

	let commandInput = $state('');
	let inputRef = $state<HTMLInputElement | null>(null);
	let bottomRef = $state<HTMLDivElement | null>(null);
	let session = useSession();

	async function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter') {
			let copiedCommandInput = commandInput;
			commandInput = '';
			if (waitingForInput.waiting) {
				submitInput(copiedCommandInput);
			} else {
				await processCommand(copiedCommandInput);
			}
		} else if (event.key === 'ArrowUp' && !waitingForInput.waiting) {
			event.preventDefault();
			const historyCommand = navigateHistory('up');
			commandInput = historyCommand;
		} else if (event.key === 'ArrowDown' && !waitingForInput.waiting) {
			event.preventDefault();
			const historyCommand = navigateHistory('down');
			commandInput = historyCommand;
		}
	}

	// Autoscroll effect - scroll to bottom whenever cmdOut changes
	$effect(() => {
		// Access cmdOut to make this effect reactive to changes
		cmdOut.length;
		// Use setTimeout to ensure DOM has updated before scrolling
		setTimeout(() => {
			bottomRef?.scrollIntoView({ behavior: 'smooth' });
		}, 0);
	});

	onMount(() => {
		inputRef?.focus();
	});
</script>

<svelte:head>
	<title>HCB PoS - {$session.data?.user?.name}</title>
</svelte:head>
<main class="flex h-screen flex-col overflow-y-auto p-4">
	{#each cmdOut as line}
		<p class="font-mono whitespace-pre text-white">{line}</p>
	{/each}

	<div class="flex items-center">
		<span class="font-mono text-green-400"
			>{waitingForInput.waiting
				? '>'
				: `${$session.data ? `(${$session.data?.user?.email})` : ''} $`}&nbsp;</span
		>
		<input
			bind:this={inputRef}
			bind:value={commandInput}
			onkeydown={handleKeydown}
			class="flex-1 border-none bg-transparent font-mono text-white placeholder-gray-500 outline-none"
			placeholder={waitingForInput.waiting ? waitingForInput.question : '...'}
		/>
	</div>

	<!-- Invisible element at the bottom for autoscroll target -->
	<div bind:this={bottomRef}></div>
</main>
