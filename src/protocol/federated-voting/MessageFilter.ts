import { Statement } from '../..';
import { Vote } from './Vote';

export class VoteFilter {
	getCompatibleAcceptVotes(votes: Set<Vote>, statement: Statement): Vote[] {
		return Array.from(votes).filter(
			(vote) => vote.statement === statement && vote.accept
		);
	}

	getCompatibleVotes(votes: Set<Vote>, statement: Statement): Vote[] {
		return Array.from(votes).filter((vote) => vote.statement === statement);
	}
}
