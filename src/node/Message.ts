import { PublicKey } from '..';
import { Vote } from './federated-voting/Vote';

export class Message {
	constructor(
		public readonly sender: PublicKey,
		public readonly receiver: PublicKey,
		public readonly vote: Vote
	) {}

	toString(): string {
		return `${this.sender} -> ${this.receiver}: ${this.vote.toString()}`;
	}
}
