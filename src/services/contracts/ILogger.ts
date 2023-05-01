export default interface ILogger {
    log(message: string, labels?: {}): void;

    error(error: Error, labels?: {}): void;

    warn(message: string, labels?: {}): void;

    beforeExit(): Promise<void>;
}