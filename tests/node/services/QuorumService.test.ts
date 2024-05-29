import assert from 'node:assert';
import { beforeEach, describe, it } from 'node:test';
import { QuorumService } from '../../../src/node/services/QuorumService';
import { PublicKey } from '../../../src';
import { QuorumSet } from '../../../src/node/federated-voting/QuorumSet';

describe('QuorumService', () => {
	const quorumService = new QuorumService();
	describe('subset of nodeset is a quorum', () => {
		const nodeSet: PublicKey[] = [];
		const quorumSets = new Map<PublicKey, QuorumSet>();
		beforeEach(() => {
			nodeSet.push(...['A', 'B', 'C']);
			quorumSets.set('A', {
				threshold: 1,
				validators: ['B'],
				innerQSets: []
			});
			quorumSets.set('B', {
				threshold: 1,
				validators: ['A'],
				innerQSets: []
			});
			quorumSets.set('C', {
				threshold: 2,
				validators: ['F', 'G'],
				innerQSets: []
			});
		});
		it('should contain a quorum for v', () => {
			const quorumSetOfV = {
				threshold: 1,
				validators: ['B'],
				innerQSets: []
			};
			const result = quorumService.containsQuorumForV(
				quorumSetOfV,
				nodeSet,
				quorumSets
			);
			assert.strictEqual(result, true);
		});
		it('should not contain a quorum for v', () => {
			const quorumSetOfV = {
				threshold: 1,
				validators: ['C'],
				innerQSets: []
			};
			const result = quorumService.containsQuorumForV(
				quorumSetOfV,
				nodeSet,
				quorumSets
			);
			assert.strictEqual(result, false);
		});
	});

	describe('nodeset is not a quorum', () => {
		const nodeSet: PublicKey[] = [];
		const quorumSets = new Map<PublicKey, QuorumSet>();
		beforeEach(() => {
			nodeSet.push(...['A', 'B']);
			quorumSets.set('A', {
				threshold: 2,
				validators: ['B', 'C', 'D'],
				innerQSets: []
			});
			quorumSets.set('B', {
				threshold: 2,
				validators: ['A', 'C', 'D'],
				innerQSets: []
			});
		});
		it('should not contain a quorum for v', () => {
			const quorumSetOfV = {
				threshold: 1,
				validators: ['B'],
				innerQSets: []
			};
			const result = quorumService.containsQuorumForV(
				quorumSetOfV,
				nodeSet,
				quorumSets
			);
			assert.strictEqual(result, false);
		});
	});
	describe('nodeset is a quorum', () => {
		const nodeSet: PublicKey[] = [];
		const quorumSets = new Map<PublicKey, QuorumSet>();
		beforeEach(() => {
			nodeSet.push(...['A', 'B', 'C', 'D']);
			quorumSets.set('A', {
				threshold: 2,
				validators: ['B', 'C', 'D'],
				innerQSets: []
			});
			quorumSets.set('B', {
				threshold: 2,
				validators: ['A', 'C', 'D'],
				innerQSets: []
			});
			quorumSets.set('C', {
				threshold: 2,
				validators: ['B', 'A', 'D'],
				innerQSets: []
			});
			quorumSets.set('D', {
				threshold: 2,
				validators: ['B', 'C', 'A'],
				innerQSets: []
			});
		});

		it('should contain a quorum for node V', () => {
			const quorumSetOfV = {
				threshold: 2,
				validators: ['B', 'C', 'A'],
				innerQSets: []
			};
			const result = quorumService.containsQuorumForV(
				quorumSetOfV,
				nodeSet,
				quorumSets
			);
			assert.strictEqual(result, true);
		});

		it('should not contain a quorum for node V', () => {
			const quorumSetOfV = {
				threshold: 2,
				validators: ['BB', 'CC', 'AA'],
				innerQSets: []
			};

			const result = quorumService.containsQuorumForV(
				quorumSetOfV,
				nodeSet,
				quorumSets
			);
			assert.strictEqual(result, false);
		});
	});
});
