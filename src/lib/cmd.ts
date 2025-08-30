import type { Command } from './cmd/base';
import { ClearCommand } from './cmd/clear';
import { AboutCommand } from './cmd/about';
import { EchoCommand } from './cmd/echo';
import { LoginCommand } from './cmd/login';
import { SignupCommand } from './cmd/signup';
import { WhoamiCommand } from './cmd/whoami';
import { LogoutCommand } from './cmd/logout';
import { LsCommand } from './cmd/ls';
import { CreateCommand } from './cmd/create';
import { RmCommand } from './cmd/rm';
import { SellCommand } from './cmd/sell';
import { LinkCommand } from './cmd/link';
import { APiCommand } from './cmd/api';
import { HookCommand } from './cmd/hook';
import { TestCommand } from './cmd/test';
import { GuideCommand } from './cmd/guide';

export const commands: Command[] = [
	new ClearCommand(),
	new AboutCommand(),
	new EchoCommand(),
	new LoginCommand(),
	new SignupCommand(),
	new WhoamiCommand(),
	new LogoutCommand(),
	new LsCommand(),
	new CreateCommand(),
	new RmCommand(),
	new SellCommand(),
	new LinkCommand(),
	new APiCommand(),
	new HookCommand(),
	new TestCommand(),
	new GuideCommand()
];

function parseArgs(commandEntire: string): string[] {
	const args: string[] = [];
	let current = '';
	let inQuotes = false;
	let quoteChar = '';

	for (let i = 0; i < commandEntire.length; i++) {
		const char = commandEntire[i];

		if ((char === '"' || char === "'") && !inQuotes) {
			inQuotes = true;
			quoteChar = char;
			continue;
		}

		if (char === quoteChar && inQuotes) {
			inQuotes = false;
			quoteChar = '';
			continue;
		}

		if (char === ' ' && !inQuotes) {
			if (current.trim()) {
				args.push(current.trim());
				current = '';
			}
			continue;
		}

		current += char;
	}

	if (current.trim()) {
		args.push(current.trim());
	}

	return args;
}

export async function executeCommand(
	commandEntire: string,
	add: (line: string) => void,
	clear: () => void,
	prompt?: (question: string) => Promise<string>
) {
	const args = parseArgs(commandEntire);
	const commandName = args[0]?.toLowerCase();
	const commandArgs = args.slice(1);
	const command = commands.find((c) => c.name === commandName);

	if (commandName === 'help') {
		add(`Available commands:`);
		add(`  help - Show this help message`);
		commands.forEach((c) => {
			add(`  ${c.name} - ${c.description}`);
		});
		return;
	}

	if (!command) {
		add(`Unknown command: ${commandName}`);
		return;
	}

	await command.execute(add, clear, commandArgs, prompt);
}
