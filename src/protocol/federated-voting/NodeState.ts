import { Statement } from '../..';
import { Node } from '../../Node';
import { Vote } from './Vote';

export class NodeState {
	phase: 'unknown' | 'accepted' | 'confirmed' = 'unknown'; //where we are in this round of federated voting for this node
	statement: Statement | null = null; //the statement we want to agree on
	peerVotes: Set<Vote> = new Set(); //the votes it picked up from its peers

	constructor(public readonly node: Node) {}
}
