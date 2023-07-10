import {model, Schema, Types} from "mongoose";
import * as crypto from "crypto";
import {generateAuthRefreshSalt} from "../utils/salt";

// interface for AuthRefreshToken
export interface IAuthRefreshToken {
    localUser: Types.ObjectId,
    chatRoom: Types.ObjectId,
    salt: Buffer,
}

const AuthRefreshToken = new Schema({
    localUser: {type: Schema.Types.ObjectId, ref: "LocalUser", required: true, immutable: true},
    chatRoom: {type: Schema.Types.ObjectId, ref: "ChatRoom", required: true, immutable: true},
    salt: {type: Buffer, required: true, default: generateAuthRefreshSalt, immutable: true},
    // expiresAt field in 30 days
    createdAt: {type: Date, required: true, default: Date.now, immutable: true},
})

const thirtyDaysInSecs = 2592000;
AuthRefreshToken.index({createdAt: 1}, {expireAfterSeconds: thirtyDaysInSecs})
export default model<IAuthRefreshToken>('AuthRefreshToken', AuthRefreshToken)