import {model, Schema, Types} from "mongoose";

// interface for InviteLink
export interface IInviteLink {
    link: Buffer,
    chatRoom: Types.ObjectId,
    createdAt: Date,
}

const InviteLink = new Schema({
    link: {type: Buffer, required: true, unique: true},
    chatRoom: {type: Schema.Types.ObjectId, ref: "ChatRoom", required: true},
    createdAt: {type: Date, default: Date.UTC, expires: 60 * 60 * 24 * 30},
})

export default model<IInviteLink>('InviteLink', InviteLink)