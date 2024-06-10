import { ProtocolEvent } from '../../ProtocolEvent';
import { Statement } from '../../Statement';

export class ConsensusReached extends ProtocolEvent {
	readonly subType = 'ConsensusReached';
	constructor(public readonly statement: Statement) {
		super();
	}

	toString(): string {
		return `[${this.subType}] ${this.statement.toString()}`;
	}
}
