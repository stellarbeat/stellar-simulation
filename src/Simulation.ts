import { BaseQuorumSet } from './node/BaseQuorumSet';
import { NodeOrchestrator } from './node/NodeOrchestrator';
import { Message } from './node/Message';
import { PublicKey } from '.';
import { NodeDTO } from './api/NodeDTO';
import { NodeDTOMapper } from './api/NodeDTOMapper';

export class Simulation {
	private messageQueue: Set<Message> = new Set();
	private nodeMap: Map<PublicKey, NodeOrchestrator> = new Map();
	private _isRunning = false;

	constructor() {
		this.setup();
	}

	setup(): void {
		//todo: take a json or something

		const quorumSet: BaseQuorumSet = {
			threshold: 2,
			validators: ['A', 'B', 'C'],
			innerQuorumSets: []
		};

		this.nodeMap.set('A', this.setupNode('A', quorumSet, ['B']));
		this.nodeMap.set('B', this.setupNode('B', quorumSet, ['A', 'C']));
		this.nodeMap.set('C', this.setupNode('C', quorumSet, ['B']));

		//@todo: validation of the network connections => only known nodes
	}

	start(): void {
		this._isRunning = true;

		//todo: Commands: AddNode, RemoveNode, AddConnection, RemoveConnection, Vote, ReceiveMessage
		//+ add them to the CommandQueue (instead of messageQueue)
		this.nodeMap.get('A')?.vote('pizza');
		this.nodeMap.get('B')?.vote('pizza');
		this.nodeMap.get('C')?.vote('burger');
	}

	next(): void {
		if (this.messageQueue.size === 0) {
			console.log(
				'\nNothing to send or execute. Consensus could be reached or could be stuck. If possible, let a node vote on a statement. Or restart the simulation \n'
			);
		} else {
			this.processMessageQueue();
		}
	}

	get isRunning(): boolean {
		return this._isRunning;
	}

	get nodes(): PublicKey[] {
		return Array.from(this.nodeMap.keys());
	}

	getNodeInfo(publicKey: PublicKey, includeQSet = false): NodeDTO | null {
		const node = this.nodeMap.get(publicKey);
		if (!node) {
			return null;
		}
		return NodeDTOMapper.toDTO(node, includeQSet);
	}

	get publicKeysWithQuorumSets(): {
		publicKey: PublicKey;
		quorumSet: BaseQuorumSet;
	}[] {
		return Array.from(this.nodeMap.entries()).map(([publicKey, node]) => ({
			publicKey,
			quorumSet: node.getQuorumSet()
		}));
	}

	get nodesWithConnections(): {
		publicKey: PublicKey;
		connections: PublicKey[];
	}[] {
		return Array.from(this.nodeMap.entries()).map(([publicKey, node]) => ({
			publicKey,
			connections: node.getConnections()
		}));
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
