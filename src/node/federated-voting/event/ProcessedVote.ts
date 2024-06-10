import { ProtocolEvent } from '../../ProtocolEvent';

import { Vote } from '../Vote';

export class ProcessedVote extends ProtocolEvent {
	readonly subType = 'ProcessedVote';
	constructor(public readonly vote: Vote) {
		super();
	}

	toString(): string {
		return `[${this.subType}] ${this.vote.toString()}`;
	}
}
