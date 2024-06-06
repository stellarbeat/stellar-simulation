import { Command } from './Command';

import { Simulation } from './Simulation';

export class SimulationStep {
	private commands: Command[] = [];

	constructor(public readonly id: number) {}

	addCommand(command: Command): void {
		this.commands.push(command);
	}

	execute(simulation: Simulation): void {
		console.log(`--- Executing step ${this.id} ---\n`);
		this.commands.forEach((command) => command.execute(simulation));
	}

	hasCommands(): boolean {
		return this.commands.length > 0;
	}

	getCommandInfo(): string {
		return JSON.stringify(
			this.commands.map((command) => command.toString()),
			null,
			2
		);
	}
}
