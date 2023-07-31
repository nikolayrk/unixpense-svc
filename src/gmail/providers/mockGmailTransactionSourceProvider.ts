import { injectable } from "inversify";
import ITransactionSourceProvider from "../../core/contracts/ITransactionSourceProvider";
import IUsesGoogleOAuth2 from "../../googleOAuth2/contracts/IUsesGoogleOAuth2";
import GoogleOAuth2Identifiers from "../../googleOAuth2/models/googleOAuth2Identifiers";
import { DependencyInjector } from "../../dependencyInjector";
import { injectables } from "../../core/types/injectables";
import { paymentDetailsTestCases } from "../types/paymentDetailsTestCases";
import { constructTransactionDataTestCase } from "../types/transactionDataTestCase";
import Constants from "../../constants";

@injectable()
export default class MockGmailTransactionSourceProvider implements ITransactionSourceProvider, IUsesGoogleOAuth2 {
    private readonly attachmentPaddingTop = `
        <html>
        <head>
        </head>
        <body><table cellspacing="1" cellpadding="0" border="0" width="100%" class="address">
            <tr>
            <td>
                <font size="5">
                <b>УниКредит Булбанк</b>
                </font>
            </td>
            <td width="17%" align="right" />
            </tr>
        </table>
        <hr size="1" />
        <table cellspacing="0" cellpadding="0" border="0" width="100%">
            <tr>
            <td width="17%">
                <font style="font-family:Arial;font-size:10.0pt;font-weight:bold;">Дата: </font>
                <font class="style0">05.08.2022 13:05:26</font>
            </td>
            </tr>
            <tr>
            <td align="left">
                <br />
                <font style="font-family:Arial;font-size:12.0pt;font-weight:bold;">Информация за операция по сметка</font>
            </td>
            </tr>
        </table>
        <p> </p>
        <font class="style0">
            <b>Сметка</b>:
                                    
                                    01</font>
        <table cellspacing="2" cellpadding="2" border="0" width="100%" class="style0">
            <tr>
            <td> </td>
            </tr>
            <tr>
            <td class="td-header" nowrap="nowrap" width="15%">Салдо към дата 
                                                        05.08.2022 13:04:35</td>
            <td width="15%" align="left">1234.56</td>
            <td> </td>
            </tr>
        </table>
        <table bordercolor="black" cellspacing="0" cellpadding="4" width="100%" class="style0" BORDER="1" FRAME="BOX" RULES="NONE">
            <tr>
            <td class="td-header" align="center" width="15%">Дата на обработка</td>
            <td class="td-header" align="center" width="5%">Референция</td>
            <td class="td-header" align="center" width="10%">Вальор</td>
            <td class="td-header" align="right" width="5%">Сума</td>
            <td class="td-header" align="center" width="5%">Тип</td>
            <td class="td-header" align="left" width="40%">Описание</td>
            <td class="td-header" align="center" width="25%">Детайли БИСЕРА</td>
            </tr>
            <tr>
            <td colspan="7">
                <hr size="1" />
            </td>
            </tr>
            <tr>` as const;

    private readonly attachmentPaddingBottom = `
            </tr>
            <tr>
            <td colspan="7">
                <hr size="1" />
            </td>
            </tr>
            <tr>
            <td class="td-header" height="1" />
            <td class="td-header" height="1" />
            <td class="td-header" height="1" />
            <td class="td-header" height="1" />
            <td class="td-header" height="1" />
            <td class="td-header" height="1" />
            <td class="td-header" height="1" />
            <td class="td-header" height="1" />
            </tr>
        </table>
        <br />
        </body>
        </html>` as const;

    public constructor() { }

    public async useOAuth2IdentifiersAsync(identifiers: GoogleOAuth2Identifiers) {
        const dummyOAuth2ClientProvider = await DependencyInjector.Singleton.generateGmailServiceAsync(injectables.GoogleOAuth2ClientProviderGenerator, identifiers);
    }

    public async * generateTransactionIdsAsync(): AsyncGenerator<string, [], undefined> {
        yield * Object.keys(paymentDetailsTestCases).filter(k => isNaN(Number(k)))[Symbol.iterator]();

        return [];
    }

    public async getAsync(transactionId: string) {
        if (transactionId === Constants.Mock.emptyTransactionSourceId) {
            return "";
        }

        if (transactionId in paymentDetailsTestCases) {
            const transactionHead = constructTransactionDataTestCase(transactionId).attachmentDataHead;
            const transactionBody = paymentDetailsTestCases[transactionId].attachmentDataBody;

            return `${this.attachmentPaddingTop}${transactionHead}${transactionBody}${this.attachmentPaddingBottom}`;
        }

        throw new Error("Transaction not found.");
    }
}