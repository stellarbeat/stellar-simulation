import { PublicKey } from '../..';
import { Statement } from './Statement';

//contains the statement a node voted from and if it accepted a vote.
export class Vote {
	constructor(
		public readonly statement: Statement, // I voted for statement
		public readonly accept: boolean, //If false: I voted for the statement, else: an intact node voted for the statement
		public readonly node: PublicKey //todo: Node or PublicKey
	) {}

	toString(): string {
		if (!this.accept) return `${this.node}: vote(${this.statement})`;
		else return `${this.node}: vote(accept(${this.statement}))`;
	}
}
