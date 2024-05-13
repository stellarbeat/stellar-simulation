import { PublicKey } from '.';
import { QuorumSet } from './QuorumSet';

//todo: do we need the Node class?
export class Node {
	constructor(public publicKey: PublicKey, public quorumSet: QuorumSet) {}

	updateQuorumSet(quorumSet: QuorumSet): void {
		this.quorumSet = quorumSet;
	}
}
