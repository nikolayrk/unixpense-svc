import ITransactionSourceProvider from "../../contracts/ITransactionSourceProvider";
import { injectables } from "../../../shared/types/injectables";
import IUsesGoogleOAuth2 from "../contracts/IUsesGoogleOAuth2";
import GoogleOAuth2Identifiers from "../models/googleOAuth2Identifiers";
import { DependencyInjector } from "../../../dependencyInjector";
import AbstractTransactionProvider from "../../providers/abstractTransactionProvider";

export default class GmailTransactionProvider extends AbstractTransactionProvider implements IUsesGoogleOAuth2 {
    protected override transactionSourceProvider: ITransactionSourceProvider;

    public constructor() {
        super();

        this.transactionSourceProvider = null!;
    }

    public async useAsync(identifiers: GoogleOAuth2Identifiers) {
        this.transactionSourceProvider = await DependencyInjector.Singleton.generateServiceAsync(injectables.GmailTransactionSourceProviderGenerator, identifiers);
    }
}