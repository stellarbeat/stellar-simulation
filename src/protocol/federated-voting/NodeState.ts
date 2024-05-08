import { Statement } from '../..';
import { Message } from '../../Message';
import { Node } from '../../Node';

export class NodeState {
	state: 'uncommitted' | 'voted' | 'accepted' | 'confirmed' = 'uncommitted';
	statement: Statement | null = null;
	receivedMessages: Set<Message> = new Set();

	constructor(public readonly node: Node) {}
}
