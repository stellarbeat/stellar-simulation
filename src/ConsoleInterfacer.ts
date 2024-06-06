import * as readline from 'readline';
import { Simulation } from './Simulation';
import { ConsoleAdjacencyMatrixVisualization } from './ConsoleAdjacencyMatrixVisualizer';
import { BaseQuorumSet } from './node/BaseQuorumSet';

export class ConsoleInterfacer {
	private rl: readline.Interface;
	private simulation: Simulation;

	constructor(
		private consoleAdjacencyMatrixVisualizer: ConsoleAdjacencyMatrixVisualization
	) {
		//todo: take a json with the scenario or initioal network config
		this.simulation = new Simulation();
		this.rl = readline.createInterface({
			input: process.stdin,
			output: process.stdout
		});

		console.log('Welcome to the Stellar Federated Voting Protocol simulation.');
		console.log('-----------------------------------------------------');
		console.log('The nodes in the network are:');
		this.listNodes(false);
		console.log('The node connections are:');
		this.showNodeConnections();
		console.log('The node trust connections are:');
		this.showNodeTrustConnections();
		this.showCommands();
		console.log(''); // empty line
		this.rl.setPrompt('Enter command: ');
		this.rl.prompt();

		this.rl
			.on('line', (input: string) => {
				this.handleCommand(input);
				this.rl.prompt();
			})
			.on('close', () => {
				console.log('Simulation ended.');
				process.exit(0);
			});
	}

	private showNodeConnections(): void {
		this.consoleAdjacencyMatrixVisualizer.visualize(
			this.simulation.nodesWithConnections
		);
	}

	private showNodeTrustConnections(): void {
		const nodesWithQuorumSets = this.simulation.publicKeysWithQuorumSets;
		const getQuorumSetMembers: (quorumSet: BaseQuorumSet) => string[] = (
			quorumSet: BaseQuorumSet
		) => {
			return quorumSet.validators.concat(
				quorumSet.innerQuorumSets.map(getQuorumSetMembers).flat()
			);
		};
		this.consoleAdjacencyMatrixVisualizer.visualize(
			nodesWithQuorumSets.map((node) => ({
				publicKey: node.publicKey,
				connections: getQuorumSetMembers(node.quorumSet)
			}))
		);
	}

	/**
	 * @todo: implement autoplay
	 */
	private showCommands(): void {
		console.log(''); // empty line
		console.log('-- Available commands --');
		console.log('*) start: Start the simulation');
		console.log('*) next: Proceed to the next step');
		console.log('*) list: Show available commands');
		console.log('*) vote PublicKey Statement: Vote on a statement');
		console.log(
			'*) nodes:list --qsets > List all nodes in the simulation, optionally showing their quorum sets'
		);
		console.log(
			'*) nodes:inspect PublicKey --qset > show node information, optionally showing its quorum set'
		);
		console.log(
			'*) nodes:history PubliKey > show the output of the nodes previous step'
		);
		console.log(
			'*) connection:list > List all connections between nodes in an adjacency matrix'
		);
		console.log(
			'*) connections:add > PublicKey PublicKey: Add a connection between two nodes'
		);
		console.log(
			'*) connections:remove PublicKey PublicKey > Remove a connection between two nodes'
		);
		console.log(
			'*) nodes:add PublicKey QuorumSet > Add a node with a given public key and quorum set'
		);
		console.log(
			'*) nodes:remove PublicKey > Remove a node from the simulation (and its connections)'
		);
		console.log(
			'*) overlay:trust > Show all trust connections between nodes in an adjacency matrix'
		);
		console.log('*) q - Quit the simulation');
	}

	private startSimulation(): void {
		if (!this.simulation.isRunning) {
			this.simulation.start();
			console.log(
				"\n-- Enter 'next' to proceed to the next step in the simulation -- \n"
			);
		} else {
			console.log('\n-- Simulation is already running.\n');
		}
	}

	private nextStep(): void {
		if (this.simulation.isRunning) {
			this.simulation.next();
			if (this.simulation.isRunning) {
				console.log(
					"\n-- Enter 'next' to proceed to the next step in the simulation -- \n"
				);
			}
		} else {
			console.log(
				'\n-- Simulation is not running. Start the simulation with "start".\n'
			);
		}
	}

	private listNodes(showQSets: boolean): void {
		if (showQSets) {
			this.listNodesWithQuorumSets();
		}
		console.log(this.simulation.nodes);
	}

	private listNodesWithQuorumSets(): void {
		console.log(this.simulation.publicKeysWithQuorumSets);
	}

	private handleCommand(command: string): void {
		const args = command.trim().split(' ');
		switch (args[0]) {
			case 'start':
				this.startSimulation();
				break;
			case 'next':
				this.nextStep();
				break;
			case 'list':
				this.showCommands();
				break;
			case 'nodes:list':
				this.listNodes(args.includes('--qsets'));
				break;
			case 'nl':
				this.listNodes(args.includes('--qsets'));
				break;
			case 'connections:list':
				this.showNodeConnections();
				break;
			case 'cl':
				this.showNodeConnections();
				break;
			case 'overlay:trust':
				this.showNodeTrustConnections();
				break;
			case 'ot':
				this.showNodeTrustConnections();
				break;
			case 'nodes:inspect':
				this.inspectNode(args[1], args.includes('--qset'));
				break;
			case 'ni':
				this.inspectNode(args[1], args.includes('--qset'));
				break;
			case 'q':
				console.log('Exiting simulation...');
				this.rl.close();
				break;
			default:
				console.log(
					'Invalid command. Enter "list" to see available commands.\n'
				);
		}
	}

	private inspectNode(publicKey: string, includeQSet: boolean): void {
		const nodeInfo = this.simulation.getNodeInfo(publicKey, includeQSet);
		if (nodeInfo) {
			console.log(JSON.stringify(nodeInfo, null, 2));
		} else {
			console.log(`Node with public key ${publicKey} not found.`);
		}
	}
}
