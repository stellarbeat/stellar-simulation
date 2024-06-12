import { Statement } from '../federated-voting/Statement';
import { StatementDTO } from './StatementDTO';

export class StatementDTOMapper {
	static toStatementDTO(statement: Statement): StatementDTO {
		return {
			value: statement.toString()
		};
	}
}
