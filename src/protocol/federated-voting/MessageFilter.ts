import { Statement } from '../..';
import { Message } from '../../Message';

export class MessageFilter {
	filter(
		messages: Set<Message>,
		statement: Statement,
		types: ('vote' | 'accept' | 'commit')[]
	): Message[] {
		return Array.from(messages).filter(
			(message) =>
				message.statement === statement && types.includes(message.type)
		);
	}
}
