import {model, Schema, Types} from "mongoose";
import * as crypto from "crypto";

const generateSalt = () => {
    const salt = Buffer.alloc(32)
    salt.write(crypto.randomBytes(32).toString('hex'))
    return salt
}

// interface for AuthRefreshToken
export interface IAuthRefreshToken {
    localUser: Types.ObjectId,
    chatRoom: Types.ObjectId,
    salt: Buffer,
}

const AuthRefreshToken = new Schema({
    localUser: {type: Schema.Types.ObjectId, ref: "LocalUser", required: true, immutable: true},
    chatRoom: {type: Schema.Types.ObjectId, ref: "ChatRoom", required: true, immutable: true},
    salt: {type: Buffer, required: true, default: generateSalt, immutable: true},
    // expiresAt field in 30 days
    createdAt: {type: Date, required: true, default: Date.now, immutable: true},
})

const thirtyDaysInSecs = 2592000;
AuthRefreshToken.index({createdAt: 1}, {expireAfterSeconds: thirtyDaysInSecs})
export default model<IAuthRefreshToken>('AuthRefreshToken', AuthRefreshToken)