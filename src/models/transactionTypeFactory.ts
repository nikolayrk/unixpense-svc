import TransactionType from "./transactionType";
import { Node } from 'node-html-parser';

export default interface TransactionTypeFactory<T extends TransactionType> {
    tryCreate(details: Node[]): T | null;
}