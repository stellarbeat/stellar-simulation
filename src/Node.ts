import { QuorumSet } from './QuorumSet';

type PublicKey = string;

//todo: do we need the Node class?
export class Node {
	constructor(public publicKey: PublicKey, public quorumSet: QuorumSet) {}

	updateQuorumSet(quorumSet: QuorumSet): void {
		this.quorumSet = quorumSet;
	}
}
