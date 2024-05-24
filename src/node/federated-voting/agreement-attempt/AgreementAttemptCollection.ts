import { Statement } from '../Statement';
import { AgreementAttempt } from './AgreementAttempt';

export class AgreementAttemptCollection {
	private attempts: Map<Statement, AgreementAttempt> = new Map();
	constructor() {
		this.attempts = new Map();
	}

	add(attempt: AgreementAttempt): void {
		this.attempts.set(attempt.statement, attempt);
	}

	addIfNotExists(attempt: AgreementAttempt): void {
		if (!this.attempts.has(attempt.statement)) {
			this.add(attempt);
		}
	}

	get(statement: Statement): AgreementAttempt | null {
		return this.attempts.get(statement) ?? null;
	}

	getOrAddIfNotExists(statement: Statement): AgreementAttempt {
		let attempt = this.get(statement);
		if (attempt === null) {
			attempt = AgreementAttempt.create(statement);
			this.add(attempt);
		}
		return attempt;
	}

	getAll(): AgreementAttempt[] {
		return Array.from(this.attempts.values());
	}
}
