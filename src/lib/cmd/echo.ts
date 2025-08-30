import { Command } from './base';

export class EchoCommand extends Command {
	constructor() {
		super('echo', 'Echo user input (demonstrates input functionality)');
	}

	async execute(
		add: (line: string) => void,
		clear: () => void,
		args: string[],
		prompt?: (question: string) => Promise<string>
	) {
		if (args.length > 0) {
			// If arguments provided, echo them directly
			add(`Echo: ${args.join(' ')}`);
		} else if (prompt) {
			// If no arguments, prompt for input
			const userInput = await prompt('Enter text to echo:');
			add(`Echo: ${userInput}`);
		} else {
			add('Error: No input provided and prompt not available');
		}
	}
}
