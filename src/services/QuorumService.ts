import { PublicKey } from '..';
import { QuorumSet } from '../QuorumSet';

export class QuorumService {
	//todo: combine the two functions into one?
	public hasSliceInQuorum(quorumSet: QuorumSet, quorum: PublicKey[]): boolean {
		return this.hasSliceInSet(quorumSet, quorum);
	}

	//we can't add the node itself to the nodeset, because it could be filtered out in the membersThatHaveSliceInSet function
	//and the whole point is to know if the set forms a quorum and if the node 'trusts
	//the quorum.
	public isQuorum(
		nodeSet: PublicKey[],
		quorumSets: Map<PublicKey, QuorumSet>
	): boolean {
		const membersThatHaveSliceInSet = this.getMembersWithSliceInSet(
			nodeSet,
			quorumSets
		);

		if (membersThatHaveSliceInSet.length === nodeSet.length) {
			return true; // the nodeSet contains a slice for each member, it is a quorum
		}

		if (membersThatHaveSliceInSet.length === 0) {
			return false; // no member has a slice in the set, it is not a quorum
		}

		// Check if the members that have a slice in the set form a quorum
		return this.isQuorum(membersThatHaveSliceInSet, quorumSets);
	}

	private getMembersWithSliceInSet(
		quorumCandidate: PublicKey[],
		quorumSets: Map<PublicKey, QuorumSet>
	): PublicKey[] {
		const nodesThatContainSlice = [];
		for (const node of quorumCandidate) {
			const quorumSet = this.getQuorumSet(node, quorumSets);
			if (this.hasSliceInSet(quorumSet, quorumCandidate)) {
				nodesThatContainSlice.push(node);
			}
		}
		return nodesThatContainSlice;
	}

	private getQuorumSet(
		node: PublicKey,
		quorumSets: Map<PublicKey, QuorumSet>
	): QuorumSet {
		return (
			quorumSets.get(node) ?? {
				threshold: 0,
				validators: [],
				innerQSets: []
			}
		);
	}

	private hasSliceInSet(quorumSet: QuorumSet, nodeSet: PublicKey[]): boolean {
		// normally a quorum set should be extended to include the node itself...
		let remainingThreshold = quorumSet.threshold;

		// Check if validators are part of the node set
		for (const validator of quorumSet.validators) {
			if (nodeSet.includes(validator)) {
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
