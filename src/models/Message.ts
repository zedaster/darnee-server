import {isValidObjectId, model, Schema, Types} from "mongoose";

export interface IMessage {
    text: string,
    sender: Types.ObjectId,
}

// type guard for IMessage
export function isMessage(message: any): message is IMessage {
    try {
        return typeof message === 'object' &&
            typeof message.text === 'string' &&
            message.text.length > 0 &&
            isValidObjectId(message.sender);
    } catch (e) {
        return false;
    }
}

const Message = new Schema({
    text: {type: String, required: true},
    sender: {type: Schema.Types.ObjectId, ref: "LocalUser", required: true}
})

export default model<IMessage>('Message', Message);