import PaymentDetails from "../models/paymentDetails";
import { inject } from "inversify";
import { injectables } from "../types/injectables";
import PaymentDetailsFactory from "../factories/paymentDetailsFactory";

export abstract class AbstractPaymentDetailsStrategy<T extends PaymentDetails> {
    protected readonly paymentDetailsFactory;

    public constructor(
        @inject(injectables.PaymentDetailsFactory)
        paymentDetailsFactory: PaymentDetailsFactory
    ) {
        this.paymentDetailsFactory = paymentDetailsFactory;
    }

    // throws PaymentDetailsProcessingError
    abstract tryCreate(transactionReference: string, paymentDetailsRaw: string[], additionalDetailsRawOrNull: string[] | null): T;
}

