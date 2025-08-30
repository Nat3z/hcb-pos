import { executeCommand } from '$lib/cmd';

export const cmdOut: string[] = $state([
	`HCB Point of Sale`,
	`Built by @nat3z`,
	`\n`,
	`Run 'login' to sign into your point of sale account`,
	`Type 'help' for help`
]);

export const waitingForInput = $state({
	waiting: false,
	question: '',
	resolve: null as ((value: string) => void) | null
});

export const commandHistory = $state<string[]>([]);
export const historyPosition = $state({ index: -1 });

export async function processCommand(command: string) {
	// Add the command to history (if not empty and not duplicate of last command)
	if (
		command.trim() &&
		(commandHistory.length === 0 || commandHistory[commandHistory.length - 1] !== command.trim())
	) {
		commandHistory.push(command.trim());
	}
	// Reset history position
	historyPosition.index = -1;

	// Add the command to output with prompt
	cmdOut.push(`$ ${command}`);

	const prompt = (question: string): Promise<string> => {
		return new Promise((resolve) => {
			waitingForInput.waiting = true;
			waitingForInput.question = question;
			waitingForInput.resolve = resolve;
		});
	};

	await executeCommand(
		command,
		(line) => cmdOut.push(line),
		() => (cmdOut.length = 0),
		prompt
	);
}

export function submitInput(input: string) {
	if (waitingForInput.waiting && waitingForInput.resolve) {
		cmdOut.push(`${waitingForInput.question} ${input}`);
		waitingForInput.resolve(input);
		waitingForInput.waiting = false;
		waitingForInput.question = '';
		waitingForInput.resolve = null;
	}
}

export function navigateHistory(direction: 'up' | 'down'): string {
	if (commandHistory.length === 0) return '';

	if (direction === 'up') {
		if (historyPosition.index === -1) {
			// Start from the most recent command
			historyPosition.index = commandHistory.length - 1;
		} else if (historyPosition.index > 0) {
			// Go to previous command
			historyPosition.index--;
		}
	} else if (direction === 'down') {
		if (historyPosition.index < commandHistory.length - 1) {
			// Go to next command
			historyPosition.index++;
		} else {
			// Reset to empty input
			historyPosition.index = -1;
			return '';
		}
	}

	return historyPosition.index >= 0 ? commandHistory[historyPosition.index] : '';
}
