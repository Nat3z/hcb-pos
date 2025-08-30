import { Command } from './base';

export class AboutCommand extends Command {
	constructor() {
		super('about', 'Show application info');
	}

	async execute(add: (line: string) => void) {
		add(`HCB Point of Sale System`);
		add(`Built by @nat3z`);
	}
}
