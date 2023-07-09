import {Types} from "mongoose";
import jwt, {JsonWebTokenError, JwtPayload, TokenExpiredError} from "jsonwebtoken";
import AuthRefreshToken from "../models/AuthRefreshToken";

class AuthorizationService {
    public async createAuthTokens(localUserId: Types.ObjectId, chatId: Types.ObjectId) {
        const payload = {user: localUserId, chat: chatId};
        const jwtToken = jwt.sign(payload, process.env.TOKEN_AUTH_SECRET!, {expiresIn: '10min'});

        const refreshTokenModel = new AuthRefreshToken({localUser: localUserId, chatRoom: chatId});
        await refreshTokenModel.save();
        const refreshPayload = {...payload, id: refreshTokenModel._id};
        const secret = process.env.REFRESH_TOKEN_AUTH_SECRET! + refreshTokenModel.salt;
        const refreshToken = jwt.sign(refreshPayload, secret, {expiresIn: '30d'});

        return {
            token: jwtToken,
            refreshToken: refreshToken
        }
    }

    public isValidAuthToken(token: string) {
        try {
            jwt.verify(token, process.env.TOKEN_AUTH_SECRET!)
            return true;
        } catch (e) {
            if (e instanceof TokenExpiredError || e instanceof JsonWebTokenError) {
                return false;
            }
            throw e;
        }
    }

    public getTokenPayload(token: string) {
        try {
            return jwt.decode(token) as JwtPayload;
        } catch (e) {
            if (e instanceof TokenExpiredError || e instanceof JsonWebTokenError) {
                return null;
            }
            throw e;
        }
    }

    // TODO: Move update auth token to this service
}

const singleton = new AuthorizationService();
export default singleton;