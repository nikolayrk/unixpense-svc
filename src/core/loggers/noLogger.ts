import { injectable } from "inversify";
import ILogger from "../contracts/ILogger";

@injectable()
export default class NoLogger implements ILogger {
    public log(message: string, labels?: Record<string, unknown>) {}

    public error(error: Error, labels?: Record<string, unknown>) {}

    public warn(message: string, labels?: Record<string, unknown>) {}

    public beforeExit = (): Promise<void> => new Promise(resolve => { resolve() });
}