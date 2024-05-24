import { Statement } from './Statement';
import { Node } from '../Node';
import { StatementValidator } from './StatementValidator';
import { Vote } from './Vote';
import { AcceptPhaseEvaluator } from './agreement-attempt/AcceptPhaseEvaluator';
import { ConfirmPhaseEvaluator } from './agreement-attempt/ConfirmPhaseEvaluator';
import { AgreementAttempt } from './agreement-attempt/AgreementAttempt';
import { AgreementAttemptCollection } from './agreement-attempt/AgreementAttemptCollection';
import assert from 'assert';

//Manages the voting process for a node in the federated voting protocol.
//A node can vote on a statement or vote to accept it. When a statement is confirmed, it can act upon it.
//Tracks all agreement attempts and handles state changes of these attempts.
export class FederatedVote {
	private agreementAttempts: AgreementAttemptCollection =
		new AgreementAttemptCollection();
	private votedStatement: Statement | null = null;

	constructor(
		private node: Node,
		private statementValidator: StatementValidator, //or should only valid Statements be passed to this class?
		private acceptPhaseEvaluator: AcceptPhaseEvaluator,
		private confirmPhaseEvaluator: ConfirmPhaseEvaluator,
		private phaseObserver: any //todo
	) {}

	//vote(statement)
	voteForStatement(statement: Statement): Vote | null {
		assert(this.statementValidator.isValid(statement, this.node));
		assert(!this.hasVotedForAStatement());

		this.getOrStartAgreementAttemptFor(statement);
		this.votedStatement = statement;

		return new Vote(statement, false, this.node.publicKey);
	}

	//receive vote from peer and return the vote to be sent to the network in response if any
	processVote(vote: Vote): Vote | null {
		if (vote.node === this.node.publicKey) return null; //it's the node own vote, agreement cannot be advanced

		if (!this.statementValidator.isValid(vote.statement, this.node)) {
			return null;
		}

		const agreementAttempt = this.getOrStartAgreementAttemptFor(vote.statement);
		if (vote.accept)
			agreementAttempt.addPeerThatVotedToAcceptStatement(vote.node);
		else agreementAttempt.addPeerThatVotedForStatement(vote.node);

		if (
			this.acceptPhaseEvaluator.canMoveToAcceptPhase(
				agreementAttempt,
				this.agreementAttempts,
				this.node
			)
		) {
			agreementAttempt.phase = 'accepted';

			return this.voteForAcceptStatement(vote.statement);
		}

		if (
			this.confirmPhaseEvaluator.canMoveToConfirmPhase(
				agreementAttempt,
				this.agreementAttempts,
				this.node
			)
		) {
			agreementAttempt.phase = 'confirmed';
		}

		return null;
	}

	//only the protocol can vote(accept(statement))
	private voteForAcceptStatement(statement: Statement) {
		return new Vote(statement, true, this.node.publicKey);
	}

	private hasVotedForAStatement(): boolean {
		//todo: if not voted on statement, but accepted a statement, should this return true?
		return this.votedStatement !== null;
	}

	private getOrStartAgreementAttemptFor(
		statement: Statement
	): AgreementAttempt {
		return this.agreementAttempts.getOrAddIfNotExists(statement);
	}

	public getAgreementAttempts(): AgreementAttempt[] {
		return this.agreementAttempts.getAll();
	}
}
