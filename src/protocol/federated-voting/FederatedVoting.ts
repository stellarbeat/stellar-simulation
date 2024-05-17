import { Statement } from '../..';
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
		private acceptHandler: AcceptHandler,
		private confirmHandler: ConfirmHandler
	) {}

	//vote(statement)
	vote(node: Node, statement: Statement): void {
		if (this.statementValidator.isValid(statement, node)) {
			//todo: should actually be node specific
			return;
		}

		node.startNewAgreementAttempt(statement);
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
			//todo: should actually be node specific
			return; // todo: log
		}

		const agreementAttempt = this.getOrStartAgreementAttempt(
			node,
			vote.statement
		);
		agreementAttempt.addPeerVote(vote);

		if (this.acceptHandler.tryToMoveToAcceptPhase(node, agreementAttempt)) {
			this.voteToAccept(node, vote.statement);
			return;
		}

		this.confirmHandler.tryToMoveToConfirmPhase(node, agreementAttempt);
		//todo: emit event
	}

	private getOrStartAgreementAttempt(node: Node, statement: Statement) {
		let agreementAttempt = node.getAgreementAttemptFor(statement);

		if (!agreementAttempt) {
			agreementAttempt = node.startNewAgreementAttempt(statement);
		}

		return agreementAttempt;
	}
}
