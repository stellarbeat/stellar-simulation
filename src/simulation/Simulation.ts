import assert from 'assert';
import { PublicKey, Statement } from '..';
import { NodeDTO } from '../api/NodeDTO';
import { NodeDTOMapper } from '../api/NodeDTOMapper';
import { BaseQuorumSet } from '../node/BaseQuorumSet';
import { Message } from '../node/Message';
import { NodeOrchestrator } from '../node/NodeOrchestrator';
import { MessageSent } from '../node/event/MessageSent';
import { ProtocolEvent } from '../node/ProtocolEvent';

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
	}

	vote(publicKey: PublicKey, statement: Statement): void {
		const node = this.nodeMap.get(publicKey);
		if (!node) {
			console.log('Node not found');
			return;
		}
		node.vote(statement);
		const events = node.drainEvents();

		events.forEach((event) => {
			if (event instanceof ProtocolEvent) {
				console.log(`[fed-vot][${node.publicKey}]${event.toString()}`);
			}
			if (event instanceof MessageSent) {
				console.log(`[overlay] ${event.toString()}`);
				this.handleMessageSentEvent(event.message);
			}
		});
	}

	hasMessages(): boolean {
		return this.messageQueue.size > 0;
	}

	moveMessagesToOutbox(): void {
		this.outbox = new Set(this.messageQueue);
		this.messageQueue.clear();
	}

	deliverMessagesInOutbox(): void {
		const messages = Array.from(this.outbox);
		this.outbox.clear();
		messages.forEach((message) => {
			const node = this.nodeMap.get(message.receiver);
			assert(node instanceof NodeOrchestrator);

			console.log(`[simulation] Deliver message: ${message}`);
			node.receiveMessage(message);
			const events = node.drainEvents();
			events.forEach((event) => {
				if (event instanceof ProtocolEvent) {
					console.log(`[fed-vot][${node.publicKey}]${event.toString()}`);
				}
				if (event instanceof MessageSent) {
					console.log(`[overlay] ${event.toString()}`);
					this.handleMessageSentEvent(event.message);
				}
			});
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

	private handleMessageSentEvent(message: Message): void {
		console.log(
			`[simulation] Queued message from ${message.sender} to ${message.receiver}`
		);
		this.messageQueue.add(message);
	}
}
