import { Node } from "node-html-parser";
import { IPaymentDetailsFactory } from "../contracts/IPaymentDetailsFactory";
import { injectable } from "inversify";
import DeskWithdrawal from "../models/deskWithdrawal";
import { TRANSACTION_TYPES } from "../types/transactionTypeString";
import TransactionType from "../enums/transactionType";

@injectable()
export default class DeskWithdrawalFactory implements IPaymentDetailsFactory<DeskWithdrawal> {
    public tryCreate(transactionReference: string, transactionDetailsNodes: Node[], additionalTransactionDetailsNode?: Node): DeskWithdrawal {
        const transactionDetailsRaw = transactionDetailsNodes
            .map(c => c.rawText)
            .filter(c => c != '');

        const descriptionWithType = transactionDetailsRaw[0];

        const typeString = TRANSACTION_TYPES[TransactionType.DESK_WITHDRAWAL];

        const description = descriptionWithType
            .replace(` /${typeString}`, '');

        const beneficiary = transactionDetailsRaw[1]
            .replace(`${description} `, '');

        const additionalDetails = additionalTransactionDetailsNode
           ?.childNodes
           ?.map(e => e.rawText.trim())
           ?.filter(e => e != '')
           ?.join('\n') ?? '';

        const transaction: DeskWithdrawal = {
            beneficiary: beneficiary,
            description: description,
            additionalDetails: additionalDetails
        }

        return transaction;
    }
}