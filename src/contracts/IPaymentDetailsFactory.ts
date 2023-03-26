import PaymentDetails from "../models/paymentDetails";
import { Node } from 'node-html-parser';
import CardOperation from "../models/cardOperation";
import CrossBorderTransfer from "../models/crossBorderTransfer";
import StandardFee from "../models/standardFee";
import StandardTransfer from "../models/standardTransfer";

export interface IPaymentDetailsFactory<T extends PaymentDetails> {
    // throws PaymentDetailsProcessingError
    tryCreate(transactionReference: string, transactionDetailsNodes: Node[], additionalTransactionDetailsNode?: Node): T;
}

export type ICardOperationFactory = IPaymentDetailsFactory<CardOperation>

export type ICrossBorderTransferFactory = IPaymentDetailsFactory<CrossBorderTransfer>

export type IStandardFeeFactory = IPaymentDetailsFactory<StandardFee>

export type IStandardTransferFactory = IPaymentDetailsFactory<StandardTransfer>