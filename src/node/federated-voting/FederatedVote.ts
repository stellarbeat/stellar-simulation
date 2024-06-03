import { Statement } from '../Statement';
import { Vote } from './Vote';
import { AgreementAttemptCollection } from './agreement-attempt/AgreementAttemptCollection';
import { Node } from './Node';
import { AgreementAttempt } from './agreement-attempt/AgreementAttempt';

export class FederatedVote {
	private agreementAttempts: AgreementAttemptCollection =
		new AgreementAttemptCollection();
	private _nodeHasVotedForAStatement = false;
	private consensus: Statement | null = null;

	constructor(public readonly node: Node) {}

	//vote(statement)
	voteForStatement(statement: Statement): Vote | null {
		if (this._nodeHasVotedForAStatement) return null;

		const vote = new Vote(
			statement,
			false,
			this.node.publicKey,
			this.node.quorumSet
		);
		this._nodeHasVotedForAStatement = true;

		this.processVote(vote);

		return vote; // ready to emit to network
	}

	nodeHasVotedForAStatement(): boolean {
		return this._nodeHasVotedForAStatement;
	}

	processVote(vote: Vote): Vote | null {
		const agreementAttempt = this.getOrStartAgreementAttempt(vote.statement);
		this.addVoteToAgreementAttempt(agreementAttempt, vote);

		if (agreementAttempt.tryMoveToAcceptPhase()) {
			const vote = this.createVoteForAcceptStatement(
				agreementAttempt.statement
			);
			this.processVote(vote);
			return vote; //ready to emit
		}

		if (agreementAttempt.tryMoveToConfirmPhase()) {
			//todo: emit event upon split consensus detected? this could happen if there is no quorum intersection in the network
			this.consensus = agreementAttempt.statement;
			return null;
		}

		return null;
	}

	//only the protocol can vote(accept(statement))
	private createVoteForAcceptStatement(statement: Statement) {
		return new Vote(statement, true, this.node.publicKey, this.node.quorumSet);
	}

	getConsensus(): Statement | null {
		return this.consensus;
	}

	hasConsensus(): boolean {
		return this.consensus !== null;
	}

	getAgreementAttempts(): AgreementAttempt[] {
		return this.agreementAttempts.getAll();
	}

	private getOrStartAgreementAttempt(statement: Statement): AgreementAttempt {
		return this.agreementAttempts.getOrAddIfNotExists(this.node, statement);
	}

	private addVoteToAgreementAttempt(
		agreementAttempt: AgreementAttempt,
		vote: Vote
	) {
		if (vote.accept)
			agreementAttempt.addVotedToAcceptStatement(
				vote.publicKey,
				vote.quorumSet
			);
		else agreementAttempt.addVotedForStatement(vote.publicKey, vote.quorumSet);
	}
}
