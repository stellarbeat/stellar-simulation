import assert from 'node:assert';
import { describe, it } from 'node:test';
import { VBlockingNodesDetector } from '../../src/services/VBlockingNodesDetector';

describe('VBlockingNodesDetector', () => {
	const vBlockingNodesDetector = new VBlockingNodesDetector();
	describe('isSetVBlocking for validators arrays', () => {
		const quorumSetOfV = {
			threshold: 1,
			validators: ['A', 'B'],
			innerQSets: []
		};

		it('should return true', () => {
			const nodeSet = ['A', 'B'];
			const result = vBlockingNodesDetector.isSetVBlocking(
				quorumSetOfV,
				nodeSet
			);
			assert.strictEqual(result, true);
		});
		it('should return false', () => {
			const result = vBlockingNodesDetector.isSetVBlocking(quorumSetOfV, ['A']);
			assert.strictEqual(result, false);

			const result2 = vBlockingNodesDetector.isSetVBlocking(quorumSetOfV, [
				'B'
			]);
			assert.strictEqual(result2, false);
		});
	});
	describe('isSetVBlocking for innerQSets arrays', () => {
		const quorumSetOfV = {
			threshold: 1,
			validators: [],
			innerQSets: [
				{
					threshold: 1,
					validators: ['A'],
					innerQSets: []
				},
				{
					threshold: 1,
					validators: ['B'],
					innerQSets: []
				}
			]
		};

		it('should return true', () => {
			const result = vBlockingNodesDetector.isSetVBlocking(quorumSetOfV, [
				'A',
				'B'
			]);
			assert.strictEqual(result, true);
		});
		it('should return false', () => {
			const result = vBlockingNodesDetector.isSetVBlocking(quorumSetOfV, ['B']);
			assert.strictEqual(result, false);
			const result2 = vBlockingNodesDetector.isSetVBlocking(quorumSetOfV, [
				'A'
			]);
			assert.strictEqual(result2, false);
		});
	});
});
