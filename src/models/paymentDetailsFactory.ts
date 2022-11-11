import PaymentDetails from "./paymentDetails";
import { Node } from 'node-html-parser';

export default interface PaymentDetailsFactory<T extends PaymentDetails> {
    create(transactionDetails: Node[]): T;
}