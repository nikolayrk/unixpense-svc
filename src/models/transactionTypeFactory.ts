import TransactionType from "./transactionTypes";
import { Node } from 'node-html-parser';

export default interface TransactionTypeFactory<T extends TransactionType> {
    create(details: Node[]): T;
}