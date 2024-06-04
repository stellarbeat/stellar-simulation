import { BaseQuorumSet } from './node/BaseQuorumSet';
import { NodeOrchestrator } from './node/NodeOrchestrator';
import { Message } from './node/Message';
import { PublicKey } from '.';

export class Simulation {
	private messageQueue: Set<Message> = new Set();
	private nodeMap: Map<PublicKey, NodeOrchestrator> = new Map();

	/**       B --- C
	 *      /        \
	 * A ---          ---D
	 *      \        /
	 *       E ---- F
	 **/
	setup(): void {
		//todo: take a json or something

		const quorumSet: BaseQuorumSet = {
			threshold: 4,
			validators: ['A', 'B', 'C', 'D', 'E', 'F'],
			innerQuorumSets: []
		};

		this.nodeMap.set('A', this.setupNode('A', quorumSet, ['B', 'E']));
		this.nodeMap.set('B', this.setupNode('B', quorumSet, ['A', 'C']));
		this.nodeMap.set('C', this.setupNode('C', quorumSet, ['B', 'D']));
		this.nodeMap.set('D', this.setupNode('D', quorumSet, ['C', 'F']));
		this.nodeMap.set('E', this.setupNode('E', quorumSet, ['A', 'F']));
		this.nodeMap.set('F', this.setupNode('F', quorumSet, ['E', 'D']));

		//todo: Commands: AddNode, RemoveNode, AddConnection, RemoveConnection, Vote, ReceiveMessage
		//+ add them to the CommandQueue (instead of messageQueue)
		this.nodeMap.get('A')?.vote('pizza');
		this.nodeMap.get('B')?.vote('pizza');
		this.nodeMap.get('C')?.vote('pizza');
		this.nodeMap.get('D')?.vote('pizza');
		this.nodeMap.get('E')?.vote('burger');
		this.nodeMap.get('F')?.vote('burger');
	}

	run(): void {
		//this should work because everything is synchronous. Meaning event emits call the listening method directly
		while (this.messageQueue.size > 0) {
			this.processMessageQueue();
		}
	}

	private setupNode(
		publicKey: string,
		quorumSet: BaseQuorumSet,
		connections: PublicKey[]
	): NodeOrchestrator {
		const node = new NodeOrchestrator(publicKey, quorumSet);
		connections.forEach((connection) => node.addConnection(connection));
		node.on('send-message', this.handleSendMessageEvent.bind(this));
		return node;
	}

	private handleSendMessageEvent(message: Message): void {
		this.messageQueue.add(message);
	}

	private processMessageQueue(): void {
		console.log(
			'processing message queue with',
			this.messageQueue.size,
			'messages'
		);
		const messages = Array.from(this.messageQueue);
		this.messageQueue.clear();
		messages.forEach((message) => {
			//find the node that is supposed to receive the message
			//node.receiveMessage(message);
			console.log('message', message.toString());
			this.nodeMap.get(message.receiver)?.receiveMessage(message);
		});
	}
}

const simulation = new Simulation();
simulation.setup();
simulation.run();
