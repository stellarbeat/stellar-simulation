import { NodeState } from '../NodeState';
import { VoteFilter } from '../MessageFilter';
import { IEventBus } from '../../../EventBus';
import { QuorumService } from '../../../services/QuorumService';
import { PublicKey, Statement } from '../../..';
import { QuorumSet } from '../../../QuorumSet';

//handles vote(accept(statement)) messages
export class Confirm {
	constructor(
		private eventBus: IEventBus,
		private messageFilter: VoteFilter,
		private quorumService: QuorumService
	) {}

	handleVoteAcceptStatement(): void {
		return;
	}

	tryConfirm(
		nodeState: NodeState,
		statement: Statement,
		quorumSets: Map<PublicKey, QuorumSet>
	): void {
		if (!this.canConfirm(nodeState, statement, quorumSets)) {
			return;
		}

		this.confirm(nodeState);
	}

	private canConfirm(
		nodeState: NodeState,
		statement: Statement,
		quorumSets: Map<PublicKey, QuorumSet>
	): boolean {
		if (nodeState.phase !== 'accepted') {
			return false;
		}

		if (nodeState.statement !== statement) {
			return false; //we cannot change our vote once we have accepted a Statement
			//todo: STUCK! how do we signal this? Could this be only through byzantine behavior?
		}

		return this.isRatified(nodeState, statement, quorumSets);
	}

	private isRatified(
		nodeState: NodeState,
		statement: Statement,
		quorumSets: Map<PublicKey, QuorumSet>
	): boolean {
		const quorumCandidate = this.messageFilter
			.getCompatibleAcceptVotes(nodeState.peerVotes, statement)
			.map((vote) => vote.node.publicKey);

		return (
			this.quorumService.isQuorum(quorumCandidate, quorumSets) &&
			this.quorumService.hasSliceInQuorum(
				nodeState.node.quorumSet,
				quorumCandidate
			)
		);
	}

	private confirm(nodeState: NodeState): void {
		nodeState.phase = 'confirmed';
		this.eventBus.emit(new NodeConfirmedEvent));
	}
}
