import CardOperation from "./cardOperation";
import CrossBorderTransfer from "./crossBorderTransfer";
import StandardFee from "./standardFee";
import StandardTransfer from "./standardTransfer";
import DeskWithdrawal from "./deskWithdrawal";
import { AbstractPaymentDetailsStrategy } from "../../core/strategies/abstractPaymentDetailsStrategy";
import CrossBorderTransferFee from "./crossBorderTransferFee";

export type ICardOperationStrategy = AbstractPaymentDetailsStrategy<CardOperation>;

export type ICrossBorderTransferStrategy = AbstractPaymentDetailsStrategy<CrossBorderTransfer>;

export type ICrossBorderTransferFeeStrategy = AbstractPaymentDetailsStrategy<CrossBorderTransferFee>;

export type IDeskWithdrawalStrategy = AbstractPaymentDetailsStrategy<DeskWithdrawal>;

export type IStandardFeeStrategy = AbstractPaymentDetailsStrategy<StandardFee>;

export type IStandardTransferStrategy = AbstractPaymentDetailsStrategy<StandardTransfer>;
