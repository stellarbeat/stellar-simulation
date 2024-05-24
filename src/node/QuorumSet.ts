type PublicKey = string;

export interface QuorumSet {
	threshold: number;
	validators: Array<PublicKey>;
	innerQSets: Array<QuorumSet>;
}
