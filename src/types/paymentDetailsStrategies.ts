import CardOperation from "../models/cardOperation";
import CrossBorderTransfer from "../models/crossBorderTransfer";
import StandardFee from "../models/standardFee";
import StandardTransfer from "../models/standardTransfer";
import DeskWithdrawal from "../models/deskWithdrawal";
import { AbstractPaymentDetailsStrategy } from "../strategies/abstractPaymentDetailsStrategy";

export type ICardOperationStrategy = AbstractPaymentDetailsStrategy<CardOperation>;

export type ICrossBorderTransferStrategy = AbstractPaymentDetailsStrategy<CrossBorderTransfer>;

export type IDeskWithdrawalStrategy = AbstractPaymentDetailsStrategy<DeskWithdrawal>;

export type IStandardFeeStrategy = AbstractPaymentDetailsStrategy<StandardFee>;

export type IStandardTransferStrategy = AbstractPaymentDetailsStrategy<StandardTransfer>;
