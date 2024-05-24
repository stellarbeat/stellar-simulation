import { QuorumSet } from '../QuorumSet';

type PublicKey = string;

export class VBlockingNodesDetector {
	//a set v-blocks a node if it overlaps with all of its quorum slices
	isSetVBlocking(quorumSetOfV: QuorumSet, nodeSet: PublicKey[]): boolean {
		if (quorumSetOfV.threshold === 0) {
			return false; //cannot overlap empty slices
		}

		let leftUntillBlocked = this.getMinimumBlockingSetSize(quorumSetOfV);

		for (const validator of quorumSetOfV.validators) {
			if (nodeSet.includes(validator)) {
				//this validator cannot be used to reach the threshold
				leftUntillBlocked--;
				if (leftUntillBlocked === 0) {
					return true;
				}
			}
		}

		for (const innerQSet of quorumSetOfV.innerQSets) {
			if (this.isSetVBlocking(innerQSet, nodeSet)) {
				//this inner set cannot be used to reach the threshold
				leftUntillBlocked--;
				if (leftUntillBlocked === 0) {
					return true;
				}
			}
		}

		return false; //we can still reach the threshold!
	}

	private getMinimumBlockingSetSize(quorumSetOfV: QuorumSet): number {
		return (
			quorumSetOfV.validators.length +
			quorumSetOfV.innerQSets.length -
			quorumSetOfV.threshold +
			1
		);
	}
}
