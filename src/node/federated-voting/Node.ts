import { QuorumSet } from './QuorumSet';
import { PublicKey } from '../..';

/**
 * A node is a participant in an FBAS system/network.
 * @see https://stellar.org/learn/stellar-consensus-protocol
 * @see https://medium.com/stellarbeatio/stellar-fbas-intuition-5b8018f58f3e
 *
 * The quorumSet of a node defines the slices (sets of nodes) that the node trusts to reach consensus.
 * When a node hears all the nodes in any of its slices assert a statement, it assumes no functioning node
 * will ever contradict that statement.
 *
 * A quorum is a set of nodes that can reach agreement on a statement. A quorum contains a slice for each member.
 * Thus every member of a quorum can be convinced of a statement by the members of that quorum.
 */
export class Node {
	constructor(public publicKey: PublicKey, public quorumSet: QuorumSet) {}

	updateQuorumSet(quorumSet: QuorumSet): void {
		this.quorumSet = quorumSet;
	}

	public isQuorum(quorumCandidate: Map<PublicKey, QuorumSet>): boolean {
		const originalQuorumCandidateSize = quorumCandidate.size;

		if (originalQuorumCandidateSize === 0) {
			return false;
		}

		quorumCandidate = this.removeMembersNotPartOfQuorum(quorumCandidate);

		if (originalQuorumCandidateSize === quorumCandidate.size) {
			// the original quorumCandidate has not been shrunk down and is a quorum
			return this.isThisNodePartOfQuorum(quorumCandidate);
		}

		// Check if the shrunk down quorumCandidate is a quorum
		return this.isQuorum(quorumCandidate);
	}

	private isThisNodePartOfQuorum(
		quorumCandidate: Map<PublicKey, QuorumSet>
	): boolean {
		return this.hasSliceInSet(this.quorumSet, quorumCandidate);
	}

	private removeMembersNotPartOfQuorum(
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
