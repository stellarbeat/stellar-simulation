import { ProtocolEvent } from '../../ProtocolEvent';
import { Vote } from '../Vote';

export class RegisteredVote extends ProtocolEvent {
	readonly subType = 'RegisteredVote';

	constructor(public readonly vote: Vote) {
		super();
	}

	toString(): string {
		return `[${this.subType}] ${this.vote.toString()}`;
	}
}
