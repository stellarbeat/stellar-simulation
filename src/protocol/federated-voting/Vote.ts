import { Node, Statement } from '../..';

//contains the statement a node voted from and if it accepted a vote.
export class Vote {
	constructor(
		public readonly statement: Statement, // I voted for statement
		public readonly accept: boolean, //If false: I voted for the statement, else: an intact node voted for the statement
		public readonly node: Node
	) {}

	toString(): string {
		if (!this.accept) return `${this.node.publicKey}: vote(${this.statement})`;
		else return `${this.node.publicKey}: vote(accept(${this.statement}))`;
	}
}
