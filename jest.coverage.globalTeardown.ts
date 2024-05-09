export default async () => {
    await globalThis.dbContainer.stop();
}