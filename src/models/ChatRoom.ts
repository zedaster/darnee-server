import {model, Schema, Types} from "mongoose";
import {IMessage} from "./Message";
import {ILocalUser} from "./LocalUser";

// interface for ChatRoom
export interface IChatRoom {
    messages: Types.Array<Types.ObjectId>,
    users: Types.Array<Types.ObjectId>,
    createdAt: Date,
}

type IChatRoomPopulated = Omit<IChatRoom, "messages" | "users"> & {
    messages: Types.Array<IMessage>,
    users: Types.Array<ILocalUser>,
}

const ChatRoom = new Schema({
    messages: [{type: Schema.Types.ObjectId, ref: "Message", default: []}],
    users: [{type: Schema.Types.ObjectId, ref: "LocalUser", required: true}],
}, {timestamps: true})

export default model<IChatRoom>('ChatRoom', ChatRoom)