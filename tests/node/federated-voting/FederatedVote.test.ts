import { describe, it } from 'node:test';
import { FederatedVote } from '../../../src/node/federated-voting/FederatedVote';
import { Node } from '../../../src';
import { QuorumSet } from '../../../src/node/federated-voting/QuorumSet';
import assert from 'node:assert';
import { Vote } from '../../../src/node/federated-voting/Vote';

describe('FederatedVote', () => {
	describe('voteForStatement', () => {
		it('should return null if the node has already voted for a statement', () => {
			const federatedVote = new FederatedVote(
				new Node('V', new QuorumSet(1, ['V']))
			);

			const statement = 'statement';
			federatedVote.voteForStatement(statement);
			const secondVote = federatedVote.voteForStatement(statement);
			assert.strictEqual(secondVote, null);
		});

		it('should start an agreement attempt and return a vote for the statement', () => {
			const quorumSet = new QuorumSet(1, ['OTHER']);
			const node = new Node('V', quorumSet);
			const federatedVote = new FederatedVote(node);

			const statement = 'statement';
			const vote = federatedVote.voteForStatement(statement);
			assert.notStrictEqual(vote, null);
			assert.strictEqual(vote?.statement, statement);
			assert.strictEqual(vote?.accept, false);
			assert.strictEqual(vote.publicKey, 'V');
			assert.deepStrictEqual(vote.quorumSet, quorumSet);
			assert.strictEqual(federatedVote.nodeHasVotedForAStatement(), true);

			const agreementAttempts = federatedVote.getAgreementAttempts();
			assert.strictEqual(agreementAttempts.length, 1);
			const agreementAttempt = agreementAttempts[0];
			assert.strictEqual(agreementAttempt.statement, statement);
			assert.strictEqual(agreementAttempt.phase, 'unknown');
			assert.strictEqual(agreementAttempt.node, node);
		});

		describe('processVote', () => {
			const quorumSet = new QuorumSet(1, ['Q']);
			const node = new Node('V', quorumSet);

			it('should start an agreement attempt', () => {
				const federatedVote = new FederatedVote(node);
				const vote = new Vote('statement', false, 'V', quorumSet);

				federatedVote.processVote(vote);

				const agreementAttempts = federatedVote.getAgreementAttempts();
				assert.strictEqual(agreementAttempts.length, 1);
				const agreementAttempt = agreementAttempts[0];
				assert.strictEqual(agreementAttempt.statement, 'statement');
				assert.strictEqual(agreementAttempt.node, node);
			});

			it('should resume work on existing agreement attempt', () => {
				const federatedVote = new FederatedVote(node);

				const vote = new Vote('statement', false, 'V', quorumSet);
				const otherVote = new Vote('statement', false, 'Q', quorumSet);

				federatedVote.processVote(vote);
				federatedVote.processVote(otherVote);

				const agreementAttempts = federatedVote.getAgreementAttempts();
				assert.strictEqual(agreementAttempts.length, 1);
				const agreementAttempt = agreementAttempts[0];
				assert.strictEqual(agreementAttempt.statement, 'statement');
				assert.strictEqual(agreementAttempt.node, node);
			});

			it('should move to accept phase', () => {
				const federatedVote = new FederatedVote(node);

				const vote = new Vote('statement', false, 'V', quorumSet);
				federatedVote.processVote(vote);

				const voteThatTriggersAccept = new Vote(
					'statement',
					false,
					'Q',
					quorumSet
				);

				const voteForAccept = federatedVote.processVote(voteThatTriggersAccept);
				assert.notStrictEqual(voteForAccept, null);
				assert.strictEqual(voteForAccept?.accept, true);

				const agreementAttempts = federatedVote.getAgreementAttempts();
				assert.strictEqual(agreementAttempts.length, 1);
				const agreementAttempt = agreementAttempts[0];
				assert.strictEqual(agreementAttempt.phase, 'accepted');
				assert.deepEqual(Array.from(agreementAttempt.getAcceptVotes().keys()), [
					'V'
				]);
			});

			it('should move to confirm phase', () => {
				const federatedVote = new FederatedVote(node);

				const vote = new Vote('statement', false, 'V', quorumSet);
				federatedVote.processVote(vote);

				const voteThatTriggersAccept = new Vote(
					'statement',
					false,
					'Q',
					quorumSet
				);
				federatedVote.processVote(voteThatTriggersAccept);

				const voteThatTriggersConfirm = new Vote(
					'statement',
					true,
					'Q',
					quorumSet
				);
				federatedVote.processVote(voteThatTriggersConfirm);

				const agreementAttempts = federatedVote.getAgreementAttempts();
				assert.strictEqual(agreementAttempts.length, 1);
				const agreementAttempt = agreementAttempts[0];
				assert.strictEqual(agreementAttempt.phase, 'confirmed');

				assert.strictEqual(federatedVote.hasConsensus(), true);
				assert.strictEqual(federatedVote.getConsensus(), 'statement');
			});
		});
	});
});
