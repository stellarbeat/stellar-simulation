import EventEmitter from 'events';
import { PublicKey } from '..';
import { FederatedVote } from './federated-voting/FederatedVote';
import { BaseQuorumSet } from './BaseQuorumSet';
import { Vote } from './federated-voting/Vote';
import { Message } from './Message';

export class NodeOrchestrator extends EventEmitter {
	private connections: Set<PublicKey> = new Set();
	private federatedVote: FederatedVote;
	private processedVotes: Set<Vote> = new Set();
	private quorumSet: BaseQuorumSet;

	constructor(public readonly publicKey: PublicKey, quorumSet: BaseQuorumSet) {
		super();
		this.quorumSet = quorumSet;
		this.federatedVote = new FederatedVote(publicKey, quorumSet); //todo: inject?
	}

	updateQuorumSet(quorumSet: BaseQuorumSet): void {
		this.quorumSet = quorumSet;
		this.federatedVote.updateQuorumSet(this.quorumSet);
	}

	getQuorumSet(): BaseQuorumSet {
		return this.quorumSet;
	}

	//todo: move to overlay class?
	addConnection(connection: PublicKey): void {
		this.connections.add(connection);
	}

	removeConnection(connection: PublicKey): void {
		this.connections.delete(connection);
	}

	getConnections(): PublicKey[] {
		return Array.from(this.connections);
	}

	receiveMessage(message: Message): void {
		const newVoteOrNull = this.federatedVote.processVote(message.vote);
		if (newVoteOrNull) this.broadcast(newVoteOrNull);

		this.broadcast(message.vote); //pass on the message
	}

	vote(statement: string): void {
		const voteOrNull = this.federatedVote.voteForStatement(statement);
		if (voteOrNull) {
			this.broadcast(voteOrNull);
		}
	}

	private broadcast(vote: Vote): void {
		if (this.processedVotes.has(vote)) return;
		this.connections.forEach((connection) => {
			console.log(`${this.publicKey}] send ${vote} to ${connection}`);
			this.emit('send-message', new Message(this.publicKey, connection, vote));
		});
		this.processedVotes.add(vote);
	}
}
