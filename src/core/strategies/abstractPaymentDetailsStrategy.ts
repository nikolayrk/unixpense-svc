import PaymentDetails from "../../core/models/paymentDetails";
import { inject, injectable } from "inversify";
import { injectables } from "../../core/types/injectables";
import PaymentDetailsFactory from "../factories/paymentDetailsFactory";

@injectable()
export abstract class AbstractPaymentDetailsStrategy<T extends PaymentDetails> {
    protected readonly paymentDetailsFactory;

    public constructor(
        @inject(injectables.PaymentDetailsFactory)
        paymentDetailsFactory: PaymentDetailsFactory
    ) {
        this.paymentDetailsFactory = paymentDetailsFactory;
    }

    // throws PaymentDetailsProcessingError
    abstract tryCreate(paymentDetailsRaw: string[], additionalDetailsRaw: string[]): T;
}

