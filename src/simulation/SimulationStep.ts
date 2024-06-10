import { Command } from './Command';

import { Simulation } from './Simulation';

export class SimulationStep {
	private commands: Command[] = [];

	constructor(public readonly id: number) {}

	addCommand(command: Command): void {
		console.log(
			`Adding command: ${command.toString()} to simulation step ${this.id}`
		);
		this.commands.push(command);
	}

	execute(simulation: Simulation): void {
		console.log(`\n--- Executing step ${this.id} ---\n`);
		this.commands.forEach((command) => {
			console.log(`Executing command: ${command.toString()}`);
			command.execute(simulation);
		});
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
