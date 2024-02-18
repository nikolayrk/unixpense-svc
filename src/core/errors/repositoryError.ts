import { SqlError } from "mariadb";
import { DatabaseError, ValidationError } from "sequelize";

export default class RepositoryError extends Error {
    constructor(error: Error) {
        const message = (error instanceof ValidationError || error instanceof DatabaseError)
            ? `${error.name}${ 'parent' in error && error.parent instanceof SqlError
                ? ` (${String(error.parent.text)})`
                : ''
            }`
            : error.message;
        
        super(message);

        this.name = 'RepositoryError';

        if (error.stack !== undefined) {
            this.stack = error.stack;
        }
    }
}