import { Request, Response } from "express";
import TransactionBuilder from "../builders/transactionBuilder";
import Transaction from "../models/transaction";
import TransactionType from "../models/transactionType";

export default class GetTransactionsRoute {
    private transactionBuilder: TransactionBuilder;

    constructor(transactionBuilder: TransactionBuilder) {
        this.transactionBuilder = transactionBuilder;
    }

    public route = async (req: Request, res: Response) => {     
        try {
            const transactions: Array<Transaction<TransactionType>> = [];
            
            for await (const transaction of this.transactionBuilder.buildAsync()) {
                transactions.push(transaction);
            }
            
            res.send(transactions);
        } catch(ex) {
            if (ex instanceof Error) {
                console.log(ex.stack);
                
                res.send(ex.stack);
            }

            return;
        }
    }
}
