import { Statement } from '.';

type PublicKey = string;

export class Message {
	constructor(
		public readonly publicKey: PublicKey,
		public readonly type: 'vote' | 'accept',
		public readonly statement: Statement
	) {}

	toString(): string {
		return `${this.publicKey}:${this.type}:${this.statement}`;
	}
}
