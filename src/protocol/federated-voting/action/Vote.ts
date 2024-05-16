import { Statement } from '../../..';
import { IEventBus } from '../../../IEventBus';
import { NodeState } from '../NodeState';
import { StatementValidator } from '../StatementValidator';

export class Voter {
	constructor(
		private statementValidator: StatementValidator,
		private eventBus: IEventBus
	) {}

	tryVoteForStatement(nodeState: NodeState, statement: Statement): void{
		if (!this.statementValidator.isValid(statement)) {
			return;
		}
		if (this.canVote(nodeState)) {
			this.emitCannotVoteError(nodeState);
		} else {
			this.vote(nodeState, statement);
		}
	}

	tryVoteForAcceptStatement(nodeState: NodeState, statement: Statement):void {

	}

	tryVote(nodeState: NodeState, statement: Statement): void {
		
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
