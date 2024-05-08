import assert from 'assert';
import { FederatedVoting } from './protocol/FederatedVoting';
import { Broadcaster } from './Broadcaster';
import { Node } from './Node';

type PublicKey = string;

export class OverlayNetwork {
	private nodes: Map<string, Node> = new Map();
	private overlayConnections: Map<PublicKey, Set<string>> = new Map();
	private broadcastedMessages: Set<string> = new Set(); // Tracks messages that have been broadcasted to prevent duplicates
	private broadcastQueue: Array<() => void> = []; // Queue for broadcast actions

	constructor(
		private federatedVotingManager: FederatedVoting,
		private broadcaster: Broadcaster
	) {}

	public addNode(node: Node): void {
		this.nodes.set(node.publicKey, node);
	}

	public removeNode(publicKey: string): void {
		this.nodes.delete(publicKey);
		this.overlayConnections.delete(publicKey);
	}

	public addConnection(fromPublicKey: string, toPublicKey: string): void {
		const fromNode = this.nodes.get(fromPublicKey);
		const toNode = this.nodes.get(toPublicKey);
		const fromConnections =
			this.overlayConnections.get(fromPublicKey) || new Set();
		const toConnections = this.overlayConnections.get(toPublicKey) || new Set();

		assert(fromNode instanceof Node, 'Node not found');
		assert(toNode instanceof Node, 'Node not found');

		fromConnections.add(toPublicKey);
		toConnections.add(fromPublicKey);

		this.overlayConnections.set(fromPublicKey, fromConnections);
		this.overlayConnections.set(toPublicKey, toConnections);
	}

	public receiveMessage(publicKey: string, message: string): void {
		const node = this.nodes.get(publicKey);
		assert(node instanceof Node, 'Node not found');

		const newMessage = this.federatedVotingManager.handleMessage(node, message);
		//todo: emit event for new message, this way Overlay is not coupled to federated voting protocol
		if (newMessage) {
			this.broadcast(node.publicKey, newMessage);
		}

		this.broadcast(publicKey, message);
	}

	public broadcast(fromPublicKey: string, message: string): void {
		const messageIdentifier = `${fromPublicKey}:${message}`;
		if (!this.broadcastedMessages.has(messageIdentifier)) {
			this.broadcastQueue.push(() =>
				this.broadcastMessage(
					message,
					this.overlayConnections.get(fromPublicKey)
				)
			);
			this.broadcastedMessages.add(messageIdentifier); // Mark as broadcasted
		}
	}

	private broadcastMessage(
		message: string,
		connections: Set<string> | undefined
	): void {
		if (!connections) {
			return;
		}

		for (const connection of connections) {
			this.receiveMessage(connection, message); //normally this would be sent over the network
		}
	}
}
