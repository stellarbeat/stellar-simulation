import { NodeState } from './NodeState';
import { Node, PublicKey, Statement } from '../..';
import { QuorumSet } from '../../QuorumSet';
import { StatementValidator } from './StatementValidator';
import { Vote } from './Vote';
import { IEventBus as EventBus } from '../../EventBus';
import { VoteEvent } from '../../VoteEvent';
import { Accept } from './action/Accept';
import { Confirm } from './action/Confirm';

export class FederatedVoting {
	private nodeStates: Map<PublicKey, NodeState> = new Map();

	constructor(
		private statementValidator: StatementValidator,
		private eventBus: EventBus,
		private acceptAction: Accept,
		private confirmAction: Confirm
	) {}

	voteForStatement(node: Node, statement: Statement): void {
		if (this.statementValidator.isValid(statement)) {
			//todo: log
			return;
		}

		const nodeState = this.getNodeState(node);
		nodeState.statement = statement;

		const vote = new Vote(statement, false, node);
		const event = new VoteEvent(node.publicKey, vote);

		this.eventBus.emit(event); //todo rethink eventbus (move to higher level?)
	}

	processVote(
		receiver: Node,
		vote: Vote,
		quorumSets: Map<PublicKey, QuorumSet>
	): void {
		const nodeState = this.getNodeState(receiver);
		//TODO improve naming towards receiver
		nodeState.peerVotes.add(vote);

		if (!this.statementValidator.isValid(vote.statement)) {
			return; // todo: log
		}

		if (this.acceptAction.tryAccept(nodeState, vote.statement, quorumSets)) {
			//broadcast vote(accept statement)
			return;
		}

		this.confirmAction.tryConfirm(nodeState, vote.statement, quorumSets);
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
