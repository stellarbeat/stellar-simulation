import { Confirm } from './action/Confirm';
import { NodeState } from './NodeState';
import { Node, PublicKey, Statement } from '../..';
import { QuorumSet } from '../../QuorumSet';
import { Accept } from './action/Accept';
import { Vote } from './action/Vote';
import { Message } from '../../Message';
import { StatementValidator } from './StatementValidator';

export class FederatedVoting {
	private nodeStates: Map<PublicKey, NodeState> = new Map();

	constructor(
		private voteAction: Vote,
		private acceptAction: Accept,
		private confirmAction: Confirm,
		private statementValidator: StatementValidator
	) {}

	vote(node: Node, statement: Statement): void {
		const nodeState = this.getNodeState(node);
		this.voteAction.tryVote(nodeState, statement);
		//broadcast vote(statement)
	}

	processMessage(
		node: Node,
		message: Message,
		quorumSets: Map<PublicKey, QuorumSet>
	): void {
		const nodeState = this.getNodeState(node);
		nodeState.receivedMessages.add(message);

		const statement = message.statement;

		if (!this.statementValidator.isValid(statement)) {
			return; // todo: log
		}

		if (this.acceptAction.tryAccept(nodeState, statement, quorumSets)) {
			//broadcast vote(accept statement)
			return;
		}

		this.confirmAction.tryConfirm(nodeState, statement, quorumSets);
	}

	private getNodeState(node: Node): NodeState {
		let nodeState = this.nodeStates.get(node.publicKey);
		if (!nodeState) {
			nodeState = new NodeState(node);
			this.nodeStates.set(node.publicKey, nodeState);
		}

		return nodeState;
	}
}
