import { Statement } from './Statement';
import { Event } from '../../Event';
import { EventBus } from '../../EventBus';
import { VoteEvent } from '../../VoteEvent';
import { Node as Node } from './Node';
import { StatementValidator } from './StatementValidator';
import { Vote } from './Vote';
import { AcceptHandler } from './agreement-attempt-handler/AcceptHandler';
import { ConfirmHandler } from './agreement-attempt-handler/ConfirmHandler';

//an instannce of federated voting for a node
export class FederatedVoting {
	constructor(
		private statementValidator: StatementValidator,
		private eventBus: EventBus,
		private agreementAttemptAcceptHandler: AcceptHandler,
		private agreementAttemptConfirmHandler: ConfirmHandler
	) {}

	//vote(statement)
	vote(node: Node, statement: Statement): void {
		if (this.statementValidator.isValid(statement, node)) {
			//todo: should actually be node specific
			return;
		}

		if (node.hasVoted()) {
			return; //can only vote once
		}

		const agreementAttempt = this.getOrStartAgreementAttempt(node, statement);
		agreementAttempt.votedFor = true;

		const vote = new Vote(statement, false, node.publicKey);
		const event = new VoteEvent(node.publicKey, vote);
		this.eventBus.emit(event); //todo rethink eventbus (move to higher level?)
	}

	//only the protocol can vote(accept(statement))
	private voteToAccept(node: Node, statement: Statement) {
		const acceptVote = new Vote(statement, true, node.publicKey);
		const event = new VoteEvent(node.publicKey, acceptVote); //todo: message!
		this.eventBus.emit(event);
		return;
	}

	receiveVote(node: Node, vote: Vote): void {
		if (vote.node === node.publicKey) return; //it's the node own vote, agreement cannot be advanced

		if (!this.statementValidator.isValid(vote.statement, node)) {
			return; // todo: log
		}

		const agreementAttempt = this.getOrStartAgreementAttempt(
			node,
			vote.statement
		);
		agreementAttempt.addPeerVote(vote);

		if (
			this.agreementAttemptAcceptHandler.tryToMoveToAcceptPhase(
				node,
				agreementAttempt
			)
		) {
			this.voteToAccept(node, vote.statement);
			return;
		}

		if (
			this.agreementAttemptConfirmHandler.tryToMoveToConfirmPhase(
				node,
				agreementAttempt
			)
		) {
			const confirmStatementEvent = {} as Event; //todo implement
			this.eventBus.emit(confirmStatementEvent);
		}
	}

	private getOrStartAgreementAttempt(node: Node, statement: Statement) {
		let agreementAttempt = node.getAgreementAttemptFor(statement);

		if (!agreementAttempt) {
			agreementAttempt = node.startNewAgreementAttempt(statement);
		}

		return agreementAttempt;
	}
}
