import { PublicKey, Statement } from '..';
import { NodeDTO } from '../api/NodeDTO';
import { NodeDTOMapper } from '../api/NodeDTOMapper';
import { BaseQuorumSet } from '../node/BaseQuorumSet';
import { Message } from '../node/Message';
import { NodeOrchestrator } from '../node/NodeOrchestrator';

//todo: is this the correct name?
export class Simulation {
	private nodeMap: Map<PublicKey, NodeOrchestrator> = new Map();
	private messageQueue: Set<Message> = new Set();
	private outbox: Set<Message> = new Set();

	addNode(
		publicKey: PublicKey,
		quorumSet: BaseQuorumSet,
		connections: PublicKey[]
	): void {
		if (this.nodeMap.has(publicKey)) {
			console.log('Node already exists');
			return;
		}
		const node = new NodeOrchestrator(publicKey, quorumSet, connections);
		this.nodeMap.set(publicKey, node);

		node.on('send-message', this.handleSendMessageEvent.bind(this));
	}

	vote(publicKey: PublicKey, statement: Statement): void {
		const node = this.nodeMap.get(publicKey);
		if (!node) {
			console.log('Node not found');
			return;
		}
		node.vote(statement);
	}

	hasMessages(): boolean {
		return this.messageQueue.size > 0;
	}

	moveMessagesToOutbox(): void {
		this.outbox = new Set(this.messageQueue);
		this.messageQueue.clear();
	}

	sendMessagesInOutbox(): void {
		console.log('Sending ', this.outbox.size, 'messages');
		const messages = Array.from(this.outbox);
		this.outbox.clear();
		messages.forEach((message) => {
			console.log('message', message.toString());
			this.nodeMap.get(message.receiver)?.receiveMessage(message);
		});
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

	private processMessageQueue(): void {}

	private handleSendMessageEvent(message: Message): void {
		console.log('received send-message event', message.toString());
		this.messageQueue.add(message);
	}
}
