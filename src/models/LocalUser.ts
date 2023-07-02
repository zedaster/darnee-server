import {model, Schema, Types} from "mongoose";

// interface for LocalUser
export interface ILocalUser {
    name: string,
    globalUser: Types.ObjectId,
}

const LocalUser = new Schema({
    name: {type: String, required: true},
    globalUser: {type: Schema.Types.ObjectId, ref: "GlobalUser", unique: true, sparse: true},
})

export default model<ILocalUser>('LocalUser', LocalUser)