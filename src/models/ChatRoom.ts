import {model, Schema, Types, Document} from "mongoose";
import {IMessage} from "./Message";
import {ILocalUser} from "./LocalUser";

// interface for ChatRoom
interface IChatRoom {
    messages: Types.Array<Types.ObjectId>,
    users: Types.Array<Types.ObjectId>,
    createdAt: Date,
}

export interface IChatRoomDocument extends IChatRoom, Document {

}

export type IChatRoomPopulated = Omit<IChatRoomDocument, "messages" | "users"> & {
    messages: Types.Array<IMessage> | null,
    users: Types.Array<ILocalUser> | null,
}

const ChatRoom = new Schema({
    messages: [{type: Schema.Types.ObjectId, ref: "Message", default: []}],
    users: [{type: Schema.Types.ObjectId, ref: "LocalUser", required: true}],
}, {timestamps: true})

export default model<IChatRoomDocument>('ChatRoom', ChatRoom)