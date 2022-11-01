import TransactionType from "./transactionType";
import { Node } from 'node-html-parser';

export default interface PaymentDetailsFactory<T extends TransactionType> {
    create(transactionDetails: Node[]): T;
}