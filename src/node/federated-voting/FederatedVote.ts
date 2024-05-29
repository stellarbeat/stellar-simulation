import { Statement } from '../Statement';
import { Vote } from './Vote';
import { AgreementAttemptCollection } from './agreement-attempt/AgreementAttemptCollection';
import { Node } from './Node';
import EventEmitter from 'events';
import { AgreementAttempt } from './agreement-attempt/AgreementAttempt';

export class FederatedVote extends EventEmitter {
	private agreementAttempts: AgreementAttemptCollection =
		new AgreementAttemptCollection();
	private nodeHasVotedForAStatement = false;
	private consensus: Statement | null = null;

	constructor(public readonly node: Node) {
		super();
	}

	//vote(statement)
	voteForStatement(statement: Statement): Vote | null {
		if (this.nodeHasVotedForAStatement) return null;

		this.getOrStartAgreementAttemptFor(statement);

		const vote = new Vote(
			statement,
			false,
			this.node.publicKey,
			this.node.quorumSet
		);
		this.nodeHasVotedForAStatement = true;
		this.processVote(vote);

		return vote; // ready to emit to network
	}

	//receive vote from peer and return the vote to be sent to the network in response if any
	processVote(vote: Vote): Vote | null {
		const agreementAttempt = this.getOrStartAgreementAttempt(vote);

		if (agreementAttempt.tryMoveToAcceptPhase()) {
			const vote = this.voteForAcceptStatement(agreementAttempt.statement);
			this.processVote(vote);
			return vote; //ready to emit
		}

		if (agreementAttempt.tryMoveToConfirmPhase()) {
			//todo: emit event upon split consensus detected? this could happen if there is no quorum intersection in the network
			this.consensus = agreementAttempt.statement;
			this.emit('agreement', agreementAttempt);
			return null;
		}

		return null;
	}

	getConsensus(): Statement | null {
		return this.consensus;
	}

	hasConsensus(): boolean {
		return this.consensus !== null;
	}

	//only the protocol can vote(accept(statement))
	private voteForAcceptStatement(statement: Statement) {
		return new Vote(statement, true, this.node.publicKey, this.node.quorumSet);
	}

	private getOrStartAgreementAttempt(vote: Vote): AgreementAttempt {
		const agreementAttempt = this.getOrStartAgreementAttemptFor(vote.statement);

		if (vote.accept)
			agreementAttempt.addVotedToAcceptStatement(
				vote.publicKey,
				vote.quorumSet
			);
		else agreementAttempt.addVotedForStatement(vote.publicKey, vote.quorumSet);

		return agreementAttempt;
	}

	private getOrStartAgreementAttemptFor(
		statement: Statement
	): AgreementAttempt {
		return this.agreementAttempts.getOrAddIfNotExists(this.node, statement);
	}
}
