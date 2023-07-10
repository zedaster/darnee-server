import {Document, Model, model, Schema, Types} from "mongoose";
import {generateInviteLinkSalt} from "../utils/salt";
import crypto from "crypto";

// interface for InviteLink
interface IInviteLink {
    chatRoom: Types.ObjectId,
    hash: Buffer,
}

export interface IInviteLinkDocument extends IInviteLink, Document {
    hashBase64url: string
}

interface IInviteLinkModel extends Model<IInviteLinkDocument> {
    getOrCreateOne(chatRoom: Types.ObjectId): Promise<IInviteLinkDocument>
    getOneByHash(hashBase64url: string): Promise<IInviteLinkDocument>
}

const InviteLink = new Schema({
    hash: {type: Buffer, required: true, unique: true},
    chatRoom: {type: Schema.Types.ObjectId, ref: "ChatRoom", required: true},
})

InviteLink.virtual('hashBase64url').get(function (this: IInviteLinkDocument) {
    return this.hash.toString('base64url')
})

InviteLink.statics.getOrCreateOne = async function (chatRoom) {
    let object = await this.findOne({chatRoom: chatRoom})
    if (!object) {
        const salt = generateInviteLinkSalt()
        const secret = process.env.JOIN_HASH_SECRET!;
        const hash = crypto.createHash('sha256').update(chatRoom + salt + secret).digest()
        object = new this({hash: hash, chatRoom: chatRoom})
        await object.save()
    }
    return object
}

InviteLink.statics.getOneByHash = function (hashBase64url: string) {
    const hash = Buffer.from(hashBase64url, 'base64url')
    return this.findOne({hash: hash})
}

export default model<IInviteLinkDocument, IInviteLinkModel>('InviteLink', InviteLink)