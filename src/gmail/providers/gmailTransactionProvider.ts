import ITransactionSourceProvider from "../../core/contracts/ITransactionSourceProvider";
import { injectables } from "../../core/types/injectables";
import IUsesGoogleOAuth2 from "../../googleOAuth2/contracts/IUsesGoogleOAuth2";
import GoogleOAuth2Identifiers from "../../googleOAuth2/types/googleOAuth2Identifiers";
import { DependencyInjector } from "../../dependencyInjector";
import AbstractTransactionProvider from "../../core/providers/abstractTransactionProvider";

export default class GmailTransactionProvider extends AbstractTransactionProvider implements IUsesGoogleOAuth2 {
    protected override transactionSourceProvider: ITransactionSourceProvider;

    public constructor() {
        super();

        this.transactionSourceProvider = null!;
    }

    public async useOAuth2IdentifiersAsync(identifiers: GoogleOAuth2Identifiers) {
        this.transactionSourceProvider = await DependencyInjector.Singleton.generateGmailServiceAsync(injectables.GmailTransactionSourceProviderGenerator, identifiers);
    }
}