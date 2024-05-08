import { VBlockingNodesDetector } from '../../../services/VBlockingNodesDetector';
import { QuorumService } from '../../../services/QuorumService';
import { MessageFilter } from '../MessageFilter';
import { IEventBus } from '../../../IEventBus';
import { QuorumSet } from '../../../QuorumSet';
import { NodeState } from '../NodeState';
import { PublicKey, Statement } from '../../..';

//handles vote(statement) and vote(accept(statement)) messages
export class Accept {
	constructor(
		private vBlockingNodesDetector: VBlockingNodesDetector,
		private quorumService: QuorumService,
		private messageFilter: MessageFilter,
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
		if (nodeState.state !== 'voted') {
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
		const acceptingNodes = this.messageFilter
			.filter(nodeState.receivedMessages, statement, ['accept'])
			.map((message) => message.publicKey);

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
		const quorumCandidate = this.messageFilter
			.filter(nodeState.receivedMessages, statement, ['vote', 'accept'])
			.map((message) => message.publicKey);

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
			this.eventBus.emit(
				'Node accepted different statement value then voted for',
				{ node: nodeState.node, statement: statement }
			); //todo: right place?
		}

		nodeState.statement = statement;
		nodeState.state = 'accepted';

		this.eventBus.emit('accepted', { value: statement }); //an intact node has accepted the statement
		//this means it will send out vote(accept) messages
	}
}
