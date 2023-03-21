import PaymentDetails from "../models/paymentDetails";
import { Node } from 'node-html-parser';

export default interface PaymentDetailsFactory<T extends PaymentDetails> {
    create(transactionDetailsNodes: Node[], additionalTransactionDetailsNode?: Node): T;
}