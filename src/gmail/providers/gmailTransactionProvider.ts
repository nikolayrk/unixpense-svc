import { injectables } from "../../core/types/injectables";
import { DependencyInjector } from "../../dependencyInjector";
import AbstractTransactionProvider from "../../core/providers/abstractTransactionProvider";
import IGmailTransactionProvider from "../contracts/IGmailTransactionProvider";
import IGmailTransactionSourceProvider from "../contracts/IGmailTransactionSourceProvider";

export default class GmailTransactionProvider extends AbstractTransactionProvider implements IGmailTransactionProvider {
    protected override transactionSourceProvider: IGmailTransactionSourceProvider;

    public constructor() {
        super();

        this.transactionSourceProvider = DependencyInjector.Singleton.resolve<IGmailTransactionSourceProvider>(injectables.ITransactionSourceProvider);
    }

    public authenticate(accessToken: string) {
        this.transactionSourceProvider.authenticate(accessToken);
    }
}