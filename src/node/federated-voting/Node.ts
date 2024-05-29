import { QuorumSet } from './QuorumSet';
import { PublicKey } from '../..';

//Todo: this node class and operations is relevant for federated-voting and scp, not for overlay. We need a better structure
export class Node {
	constructor(public publicKey: PublicKey, public quorumSet: QuorumSet) {}

	updateQuorumSet(quorumSet: QuorumSet): void {
		this.quorumSet = quorumSet;
	}

	public isQuorum(quorumCandidate: Map<PublicKey, QuorumSet>): boolean {
		const membersThatHaveSliceInCandidate =
			this.getMembersWithSliceInSet(quorumCandidate);

		if (membersThatHaveSliceInCandidate.size === quorumCandidate.size) {
			//if all members of the candidate have a slice in the candidate, we have a quorum!
			//but the quorum could be smaller than the candidate, and does not neccesarily include this node itself
			//so we need to check if this node is part of the quorum
			return this.hasSliceInSet(this.quorumSet, quorumCandidate);
		}

		if (membersThatHaveSliceInCandidate.size === 0) {
			return false; // no member has a slice in the set, it is not a quorum
		}

		// Check if the members that have a slice in the set form a (smaller) quorum themselves
		return this.isQuorum(membersThatHaveSliceInCandidate);
	}

	private getMembersWithSliceInSet(
		quorumCandidate: Map<PublicKey, QuorumSet>
	): Map<PublicKey, QuorumSet> {
		const nodesThatContainSlice = new Map<PublicKey, QuorumSet>();
		for (const [publicKey, quorumSet] of quorumCandidate) {
			if (this.hasSliceInSet(quorumSet, quorumCandidate)) {
				nodesThatContainSlice.set(publicKey, quorumSet);
			}
		}
		return nodesThatContainSlice;
	}

	private hasSliceInSet(
		quorumSet: QuorumSet,
		nodeSet: Map<PublicKey, QuorumSet>
	): boolean {
		let remainingThreshold = quorumSet.threshold;

		// Check if validators are part of the node set
		for (const validator of quorumSet.validators) {
			if (Array.from(nodeSet.keys()).includes(validator)) {
				remainingThreshold--;
				if (remainingThreshold === 0) return true;
			}
		}

		// Recursively check inner quorum sets
		for (const innerSet of quorumSet.innerQSets) {
			if (this.hasSliceInSet(innerSet, nodeSet)) {
				remainingThreshold--;
				if (remainingThreshold === 0) return true;
			}
		}

		return false;
	}
}
