import assert from 'assert';
import { Statement } from './Statement';
import { Vote } from './Vote';

/*
 * An attempt on agreement by a specific node on a specific statement.
 */
export class AgreementAttempt {
	private peerVotes: Set<Vote> = new Set(); //the votes for this statement it picked up from its peers

	public phase: 'unknown' | 'accepted' | 'confirmed' = 'unknown'; //where we are in this round of federated voting for this node
	public votedFor = false; //if the node voted for this statement

	private constructor(public readonly statement: Statement) {}

	addPeerVote(vote: Vote): void {
		assert(this.statement === vote.statement);
		this.peerVotes.add(vote);
	}

	getAllVotes(): Vote[] {
		return Array.from(this.peerVotes);
	}

	getAcceptVotes(): Vote[] {
		return Array.from(this.peerVotes).filter((vote) => vote.accept === true);
	}

	static create(statement: Statement): AgreementAttempt {
		return new this(statement);
	}
}
