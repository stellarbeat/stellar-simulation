import { QuorumSet } from './QuorumSet';
import { PublicKey } from '..';

export class Node {
	public peerQuorumSets: Map<PublicKey, QuorumSet> = new Map();

	constructor(public publicKey: PublicKey, public quorumSet: QuorumSet) {}

	updateQuorumSet(quorumSet: QuorumSet): void {
		this.quorumSet = quorumSet;
	}

	updatePeerQuorumSet(publicKey: PublicKey, quorumSet: QuorumSet): void {
		this.peerQuorumSets.set(publicKey, quorumSet);
	}
}
