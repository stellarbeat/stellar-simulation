import { Statement } from '../../..';
import { IEventBus } from '../../../IEventBus';
import { NodeState } from '../NodeState';
import { StatementValidator } from '../StatementValidator';

export class Vote {
	constructor(
		private statementValidator: StatementValidator,
		private eventBus: IEventBus
	) {}

	tryVote(nodeState: NodeState, statement: Statement): void {
		if (!this.statementValidator.isValid(statement)) {
			return;
		}
		if (this.canVote(nodeState)) {
			this.emitCannotVoteError(nodeState);
		} else {
			this.vote(nodeState, statement);
		}
	}

	private canVote(nodeState: NodeState): boolean {
		return nodeState.state === 'uncommitted';
	}

	private vote(nodeState: NodeState, statement: Statement): void {
		nodeState.statement = statement;
		nodeState.state = 'voted';

		this.eventBus.emit('voted', { node: nodeState.node, statement: statement });
	}

	private emitCannotVoteError(nodeState: NodeState): void {
		this.eventBus.emit('error', {
			message: 'Node has already voted',
			node: nodeState.node
		});
	}
}


vote(statement) handler
vote(accept statement) handler
