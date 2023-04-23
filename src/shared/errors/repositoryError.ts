import { SqlError } from "mariadb";
import { DatabaseError, ValidationError } from "sequelize";

export default class RepositoryError extends Error {
    constructor(error: DatabaseError | ValidationError) {
        const message = `${error.message}: ${error.name}${ 'parent' in error && error.parent instanceof SqlError
            ? ` (${String(error.parent.text)})`
            : ''
        }`;
        
        super(message);

        this.name = 'RepositoryError';

        if (error.stack !== undefined) {
            this.stack = error.stack;
        }
    }
}