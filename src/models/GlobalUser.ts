import {model, Schema} from "mongoose";

export interface IGlobalUser {
    email: string,
}

const GlobalUser = new Schema({
    email: {type: String, required: true, unique: true},
});

export default model<IGlobalUser>('GlobalUser', GlobalUser);