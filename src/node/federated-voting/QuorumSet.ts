import { PublicKey } from '../..';

export class QuorumSet {
	constructor(
		public readonly validators: PublicKey[],
		public readonly innerQSets: QuorumSet[],
		public readonly threshold: number
	) {}

	isSetVBlocking(nodeSet: PublicKey[]): boolean {
		return this.isSetVBlockingInternal(nodeSet, this);
	}

	private isSetVBlockingInternal(
		nodeSet: PublicKey[],
		quorumSet: QuorumSet
	): boolean {
		if (quorumSet.threshold === 0) {
			return false; //cannot overlap empty slices
		}

		let leftUntillBlocked = this.getMinimumBlockingSetSize(quorumSet);

		for (const validator of quorumSet.validators) {
			if (nodeSet.includes(validator)) {
				//this validator cannot be used to reach the threshold
				leftUntillBlocked--;
				if (leftUntillBlocked === 0) {
					return true;
				}
			}
		}

		for (const innerQSet of quorumSet.innerQSets) {
			if (this.isSetVBlockingInternal(nodeSet, innerQSet)) {
				//this inner set cannot be used to reach the threshold
				leftUntillBlocked--;
				if (leftUntillBlocked === 0) {
					return true;
				}
			}
		}

		return false; //we can still reach the threshold!
	}

	private getMinimumBlockingSetSize(quorumSet: QuorumSet): number {
		return (
			quorumSet.validators.length +
			quorumSet.innerQSets.length -
			quorumSet.threshold +
			1
		);
	}
}
