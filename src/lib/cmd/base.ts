/* eslint-disable @typescript-eslint/no-unused-vars */
export class Command {
	constructor(
		public name: string,
		public description: string
	) {}

	async execute(
		add: (line: string) => void,
		clear: () => void,
		args: string[],
		prompt?: (question: string) => Promise<string>
	) {
		throw new Error('Not implemented');
	}
}
