import { Statement } from '../../Statement';
import { Node, PublicKey } from '../../..';
import { QuorumSet } from '../QuorumSet';

/*
 * An attempt on agreement by a specific node on a specific statement.
 */
export class AgreementAttempt {
	// a node could change its quorumSet, so we need to keep track of the quorumSet of the votes
	private votesForStatement: Map<PublicKey, QuorumSet> = new Map(); //the peers that voted for this statement
	private votesToAcceptStatement: Map<PublicKey, QuorumSet> = new Map(); //the peers that accepted this statement

	public phase: 'unknown' | 'accepted' | 'confirmed' = 'unknown'; //where we are in this round of federated voting for this node
	public votedFor = false; //if the node voted for this statement

	private constructor(
		public readonly node: Node,
		public readonly statement: Statement
	) {}

	addVotedForStatement(publicKey: PublicKey, quorumSet: QuorumSet): void {
		this.votesForStatement.set(publicKey, quorumSet);
	}

	addVotedToAcceptStatement(publicKey: PublicKey, quorumSet: QuorumSet): void {
		this.votesToAcceptStatement.set(publicKey, quorumSet);
	}

	//get vote(statement) + vote(accept(statement))
	private getAllVotes(): Map<PublicKey, QuorumSet> {
		return new Map([...this.votesForStatement, ...this.votesToAcceptStatement]);
	}

	private getAcceptVotes(): Map<PublicKey, QuorumSet> {
		return this.votesToAcceptStatement;
	}

	static create(node: Node, statement: Statement): AgreementAttempt {
		return new this(node, statement);
	}

	tryMoveToAcceptPhase(): boolean {
		if (this.areAcceptingNodesVBlocking()) {
			this.phase = 'accepted';
			return true;
		}

		if (this.isVoteRatified()) {
			this.phase = 'accepted';
			return true;
		}

		return false;
	}

	tryMoveToConfirmPhase(): boolean {
		if (this.isAcceptVoteRatified()) {
			this.phase = 'confirmed';
			return true;
		}

		return false;
	}

	private areAcceptingNodesVBlocking(): boolean {
		return this.node.quorumSet.isSetVBlocking(
			Array.from(this.getAcceptVotes().keys())
		);
	}

	private isVoteRatified(): boolean {
		return this.node.isQuorum(this.getAllVotes());
	}

	private isAcceptVoteRatified(): boolean {
		return this.node.isQuorum(this.getAcceptVotes());
	}
}
