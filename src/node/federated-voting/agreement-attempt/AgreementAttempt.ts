import { Statement } from '../Statement';
import { PublicKey } from '../../..';

/*
 * An attempt on agreement by a specific node on a specific statement.
 */
export class AgreementAttempt {
	private peersThatVotedForStatement: Set<PublicKey> = new Set(); //the peers that voted for this statement
	private peersThatVotedToAcceptStatement: Set<PublicKey> = new Set(); //the peers that accepted this statement

	public phase: 'unknown' | 'accepted' | 'confirmed' = 'unknown'; //where we are in this round of federated voting for this node
	public votedFor = false; //if the node voted for this statement

	private constructor(public readonly statement: Statement) {}

	addPeerThatVotedForStatement(peer: PublicKey): void {
		this.peersThatVotedForStatement.add(peer);
	}

	addPeerThatVotedToAcceptStatement(peer: PublicKey): void {
		this.peersThatVotedToAcceptStatement.add(peer);
	}

	getPeersThatVotedForAndVotedToAcceptStatement(): PublicKey[] {
		return Array.from(this.peersThatVotedForStatement).concat(
			Array.from(this.peersThatVotedToAcceptStatement)
		);
	}

	getPeersThatVotedToAcceptStatement(): PublicKey[] {
		return Array.from(this.peersThatVotedToAcceptStatement);
	}

	static create(statement: Statement): AgreementAttempt {
		return new this(statement);
	}
}
