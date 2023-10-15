import { EntryTypeExtensions } from "../../core/extensions/entryTypeExtensions";

const entryTypes = {
    type: "string",
    enum: EntryTypeExtensions.keys()
};

export { entryTypes };