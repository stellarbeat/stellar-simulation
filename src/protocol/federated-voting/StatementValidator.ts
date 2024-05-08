import { Statement } from '../..';

//in the future this should be an interface, that is implemented in the context (e.g. valid statement in ledger, valid lunch option, etc.)
export class StatementValidator {
	isValid(statement: Statement): boolean {
		return statement.length > 0;
	}
}
