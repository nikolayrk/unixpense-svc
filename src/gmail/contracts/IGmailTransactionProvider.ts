import ITransactionProvider from "src/core/contracts/ITransactionProvider";
import IUsesGoogleAuth from "./IUsesGoogleAuth";

export default interface IGmailTransactionProvider extends ITransactionProvider, IUsesGoogleAuth {}
