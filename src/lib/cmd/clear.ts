import { Command } from './base';

export class ClearCommand extends Command {
	constructor() {
		super('clear', 'Clear the screen');
	}

	async execute(add: (line: string) => void, clear: () => void) {
		clear();
	}
}
