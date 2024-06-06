import { Statement } from '../Statement';
import { Vote } from './Vote';
import { AgreementAttemptCollection } from './agreement-attempt/AgreementAttemptCollection';
import { Node } from './Node';
import { AgreementAttempt } from './agreement-attempt/AgreementAttempt';
import { BaseQuorumSet } from '../BaseQuorumSet';
import { QuorumSet } from './QuorumSet';
import { PublicKey } from '../..';

export class FederatedVote {
	private agreementAttempts: AgreementAttemptCollection =
		new AgreementAttemptCollection();
	private _nodeHasVotedForAStatement = false;
	private consensus: Statement | null = null;
	private node: Node;

	constructor(publicKey: PublicKey, quorumSet: BaseQuorumSet) {
		this.node = new Node(publicKey, QuorumSet.fromBaseQuorumSet(quorumSet));
	}

	//vote(statement)
	voteForStatement(statement: Statement): Vote | null {
		if (this._nodeHasVotedForAStatement) return null;

		const vote = new Vote(
			statement,
			false,
			this.node.publicKey,
			this.node.quorumSet.toBaseQuorumSet()
		);
		this._nodeHasVotedForAStatement = true;
		console.log(`Node ${this.node.publicKey}] vote(${statement})`);

		this.processVote(vote);

		return vote; // ready to emit to network
	}

	nodeHasVotedForAStatement(): boolean {
		return this._nodeHasVotedForAStatement;
	}

	processVote(vote: Vote): Vote | null {
		console.log(`${this.node.publicKey}] process ${vote}`);
		let agreementAttempt = this.agreementAttempts.get(vote.statement);
		if (!agreementAttempt) {
			console.log(
				`${this.node.publicKey}] New agreement attempt for statement ${vote.statement}`
			);
			agreementAttempt = AgreementAttempt.create(this.node, vote.statement);
			this.agreementAttempts.add(agreementAttempt);
		}

		//todo: check if the vote is already processed
		console.log(
			`${this.node.publicKey}] add ${vote} to agreement attempt for statement ${vote.statement}`
		);
		this.addVoteToAgreementAttempt(agreementAttempt, vote);

		if (agreementAttempt.tryMoveToAcceptPhase()) {
			console.log(
				`${this.node.publicKey}] moved agreement on statement ${vote.statement} to accept phase`
			);

			const myVote = this.createVoteForAcceptStatement(
				agreementAttempt.statement
			);

			this.processVote(myVote);
			return myVote; //ready to emit
		}

		if (agreementAttempt.tryMoveToConfirmPhase()) {
			console.log(
				`${this.node.publicKey}] moved agreement on statement ${vote.statement} to confirm phase`
			);
			//todo: emit event upon split consensus detected? this could happen if there is no quorum intersection in the network
			this.consensus = agreementAttempt.statement;
			console.log(
				`${this.node.publicKey}] consensus reached on statement ${vote.statement}`
			);
			return null;
		}

		return null;
	}

	//only the protocol can vote(accept(statement))
	private createVoteForAcceptStatement(statement: Statement) {
		console.log(`${this.node.publicKey}] vote(accept(${statement}))`);
		return new Vote(
			statement,
			true,
			this.node.publicKey,
			this.node.quorumSet.toBaseQuorumSet()
		);
	}

	getConsensus(): Statement | null {
		return this.consensus;
	}

	hasConsensus(): boolean {
		return this.consensus !== null;
	}

	getAgreementAttempts(): AgreementAttempt[] {
		return this.agreementAttempts.getAll();
	}

	updateQuorumSet(quorumSet: BaseQuorumSet): void {
		this.node.updateQuorumSet(QuorumSet.fromBaseQuorumSet(quorumSet));
	}

	getNode(): Node {
		return this.node;
	}

	private addVoteToAgreementAttempt(
		agreementAttempt: AgreementAttempt,
		vote: Vote
	) {
		if (vote.accept)
			agreementAttempt.addVotedToAcceptStatement(
				vote.publicKey,
				QuorumSet.fromBaseQuorumSet(vote.quorumSet)
			);
		else
			agreementAttempt.addVotedForStatement(
				vote.publicKey,
				QuorumSet.fromBaseQuorumSet(vote.quorumSet)
			);
	}
}
