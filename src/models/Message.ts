import {model, Schema, Types} from "mongoose";

export interface IMessage {
    text: string,
    sender: Types.ObjectId,
}

// type for message sent from client
type IClientMessage = Omit<IMessage, 'sender'>;

// type guard for IMessage
export function isClientMessage(message: any): message is IClientMessage {
    try {
        return typeof message === 'object' &&
            typeof message.text === 'string' &&
            message.text.length > 0
    } catch (e) {
        return false;
    }
}

const Message = new Schema({
    text: {type: String, required: true},
    sender: {type: Schema.Types.ObjectId, ref: "LocalUser", required: true}
})

export default model<IMessage>('Message', Message);