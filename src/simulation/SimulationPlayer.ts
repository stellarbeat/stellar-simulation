import { BaseQuorumSet } from '../node/BaseQuorumSet';
import { PublicKey, Statement } from '..';
import { NodeDTO } from '../api/NodeDTO';
import { Simulation } from './Simulation';
import { VoteCommand } from './command/AddVoteCommand';
import { SimulationStep } from './SimulationStep';
import { AddNodeCommand } from './command/AddNodeCommand';

export class SimulationPlayer {
	private executedSteps: SimulationStep[] = [];
	private simulation: Simulation = new Simulation();
	private currentSimulationStep: SimulationStep = new SimulationStep(0);

	start(): void {
		//todo: take a json or something for a scenario
		this.simulation = new Simulation();
		this.currentSimulationStep = new SimulationStep(0);
		this.executedSteps = [];
		const quorumSet: BaseQuorumSet = {
			threshold: 2,
			validators: ['A', 'B', 'C'],
			innerQuorumSets: []
		};

		this.addNode('A', quorumSet, ['B']);
		this.addNode('B', quorumSet, ['A', 'C']);
		this.addNode('C', quorumSet, ['B']);
		this.executeCurrentStep();

		//@todo: validation of the network connections => only known nodes or ignore?
	}

	addNode(
		publicKey: PublicKey,
		quorumSet: BaseQuorumSet,
		connections: PublicKey[]
	): void {
		const addNodeCommand = new AddNodeCommand(
			publicKey,
			quorumSet,
			connections
		);
		this.currentSimulationStep.addCommand(addNodeCommand);
	}

	public vote(publicKey: PublicKey, statement: Statement): void {
		this.currentSimulationStep.addCommand(
			new VoteCommand(publicKey, statement)
		);
	}

	next(): void {
		if (this.currentSimulationStep.id === 1) {
			//todo: replace with scenario instead of hard code
			this.vote('A', 'pizza');
			this.vote('B', 'pizza');
			this.vote('C', 'burger');
		}

		this.executeCurrentStepAndSendMessage();
	}

	getNextCommandsInfo(): string {
		return this.currentSimulationStep.getCommandInfo();
	}

	//sends messages after the commands are executed
	private executeCurrentStepAndSendMessage(): void {
		if (
			!this.currentSimulationStep.hasCommands() &&
			!this.simulation.hasMessages()
		) {
			console.log('Nothing to do');
			return;
		}

		//allow to capture new messages for the next step
		this.simulation.moveMessagesToOutbox();
		this.executeCurrentStep();
		this.simulation.sendMessagesInOutbox();
	}

	private executeCurrentStep(): void {
		const currentStepId = this.currentSimulationStep.id;
		this.currentSimulationStep.execute(this.simulation);
		this.executedSteps.push(this.currentSimulationStep);
		this.currentSimulationStep = new SimulationStep(currentStepId + 1);
	}

	public undoLastStep(): void {
		if (this.executedSteps.length === 0) {
			console.log('Nothing to undo');
			return;
		}
		const removedStep = this.executedSteps.pop();
		if (!removedStep) {
			console.log('Nothing to undo');
			return;
		}
		this.simulation = new Simulation();
		this.executedSteps.forEach((step) => step.execute(this.simulation));
		this.currentSimulationStep = new SimulationStep(removedStep.id);
	}

	get nodes(): PublicKey[] {
		return this.simulation.nodes;
	}

	getNodeInfo(publicKey: PublicKey, includeQSet = false): NodeDTO | null {
		return this.simulation.getNodeInfo(publicKey, includeQSet);
	}

	get publicKeysWithQuorumSets(): {
		publicKey: PublicKey;
		quorumSet: BaseQuorumSet;
	}[] {
		return this.simulation.publicKeysWithQuorumSets;
	}

	get nodesWithConnections(): {
		publicKey: PublicKey;
		connections: PublicKey[];
	}[] {
		return this.simulation.nodesWithConnections;
	}
}
