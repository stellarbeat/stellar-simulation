import { ProtocolEvent } from '../../ProtocolEvent';
import { Vote } from '../Vote';

export class Voted extends ProtocolEvent {
	readonly subType = 'Voted';
	constructor(public readonly vote: Vote) {
		super();
	}

	toString(): string {
		return `[${this.subType}] ${this.vote.toString()}`;
	}
}
