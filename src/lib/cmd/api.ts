import { Command } from './base';

export class APiCommand extends Command {
	constructor() {
		super('api', 'Create/Regenerate an API key');
	}

	async execute(add: (line: string) => void) {
		const apiKey = await fetch('/d/api', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			}
		});
		const data = await apiKey.json();
		add(`Your API key is: ${data.apiKey}`);
	}
}
