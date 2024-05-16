import { VBlockingNodesDetector } from '../../../services/VBlockingNodesDetector';
import { QuorumService } from '../../../services/QuorumService';
import { VoteFilter } from '../MessageFilter';
import { IEventBus } from '../../../EventBus';
import { QuorumSet } from '../../../QuorumSet';
import { NodeState } from '../NodeState';
import { PublicKey, Statement } from '../../..';
import { Vote } from '../Vote';
import { VoteEvent } from '../../../VoteEvent';

//handles vote(statement) and vote(accept(statement)) messages
export class Accept {
	constructor(
		private vBlockingNodesDetector: VBlockingNodesDetector,
		private quorumService: QuorumService,
		private voteFilter: VoteFilter,
		private eventBus: IEventBus
	) {}

	public tryAccept(
		nodeState: NodeState,
		statement: Statement,
		quorumSets: Map<string, QuorumSet>
	): boolean {
		if (!this.canAccept(nodeState, statement, quorumSets)) {
			return false;
		}

		this.accept(nodeState, statement);

		return true;
	}

	private canAccept(
		nodeState: NodeState,
		statement: Statement,
		quorumSets: Map<PublicKey, QuorumSet>
	): boolean {
		if (nodeState.phase !== 'unknown') {
			return false;
		}

		if (this.isVBlocking(nodeState, statement)) {
			return true;
		}

		if (this.isRatified(nodeState, statement, quorumSets)) {
			return true;
		}

		return false;
	}

	private isVBlocking(nodeState: NodeState, statement: Statement): boolean {
		const acceptingNodes = this.voteFilter
			.getCompatibleAcceptVotes(nodeState.peerVotes, statement)
			.map((vote) => vote.node.publicKey);

		return this.vBlockingNodesDetector.isSetVBlocking(
			nodeState.node.quorumSet,
			acceptingNodes
		);
	}

	private isRatified(
		nodeState: NodeState,
		statement: Statement,
		quorumSets: Map<PublicKey, QuorumSet>
	): boolean {
		const quorumCandidate = this.voteFilter
			.getCompatibleVotes(nodeState.peerVotes, statement)
			.map((vote) => vote.node.publicKey);

		return (
			this.quorumService.isQuorum(quorumCandidate, quorumSets) &&
			this.quorumService.hasSliceInQuorum(
				nodeState.node.quorumSet,
				quorumCandidate
			)
		);
	}

	private accept(nodeState: NodeState, statement: Statement): void {
		if (nodeState.statement !== statement) {
			return; //todo; emit event?
		}

		nodeState.statement = statement;
		nodeState.phase = 'accepted';

		const vote = new Vote(statement, true, nodeState.node);
		const event = new VoteEvent(nodeState.node.publicKey, vote);

		this.eventBus.emit(event); //an intact node has accepted the statement
		//this means it will send out vote(accept) messages
	}
}
