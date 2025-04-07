import ITransactionSourceProvider from "src/core/contracts/ITransactionSourceProvider";
import IUsesGoogleAuth from "./IUsesGoogleAuth";

export default interface IGmailTransactionSourceProvider extends ITransactionSourceProvider, IUsesGoogleAuth {}
