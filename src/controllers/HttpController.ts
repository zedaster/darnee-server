import {Request, Response} from "express";
import LocalUser from "../models/LocalUser";
import ChatRoom from "../models/ChatRoom";
import {validationResult} from "express-validator";
import {Types} from "mongoose";
import jwt, {JwtPayload} from "jsonwebtoken";
import AuthRefreshToken from "../models/AuthRefreshToken";
import AuthorizationService from "../services/AuthorizationService";

export class HttpController {
    async createRoom(request: Request, response: Response) {
        try {
            const {username, email} = request.body
            // TODO: Work with email and global user later
            const errors = validationResult(request);
            if (!errors.isEmpty()) {
                return response.status(400).json({message: "Create room response errors", errors: errors.array()});
            }

            const localUser = new LocalUser({name: username})
            await localUser.save()
            const chatRoom = new ChatRoom({users: [localUser._id]})
            await chatRoom.save()

            const authTokens = await AuthorizationService.createAuthTokens(localUser._id, chatRoom._id);
            response.status(200).json({message: "Room created", data: authTokens});
        } catch (e) {
            console.log(e);
            response.status(400).json({message: "Create room error"});
        }
    }

    async restoreRooms(request: Request, response: Response) {
        try {
            // TODO: Create joinRooms method first, test without email, then integrate with email
        } catch (e) {
            console.log(e);
            response.status(400).json({message: "Restore rooms error"});
        }
    }

    async joinRooms(request: Request, response: Response) {
        try {

        } catch (e) {
            console.log(e);
            response.status(400).json({message: "Join room error"});
        }

    }

    async updateToken(request: Request, response: Response) {
        try {
            const {refreshToken} = request.body;
            const errors = validationResult(request);
            if (!errors.isEmpty()) {
                return response.status(400).json({message: "Update token response errors", errors: errors.array()});
            }

            const payload = jwt.decode(refreshToken) as JwtPayload;
            const refreshTokenModel = await AuthRefreshToken.findById(payload.id);
            if (!refreshTokenModel) {
                return response.status(400).json({message: "Update token error"});
            }

            const secret = process.env.REFRESH_TOKEN_AUTH_SECRET! + refreshTokenModel.salt;
            // Verify throws an error if the token is invalid
            jwt.verify(refreshToken, secret);

            const payloadUserId = new Types.ObjectId(payload.user);
            const payloadChatId = new Types.ObjectId(payload.chat);

            if (!refreshTokenModel.localUser.equals(payloadUserId) || !refreshTokenModel.chatRoom.equals(payloadChatId)) {
                console.log('The local user or the chat room from token payload not the same as it\'s in DB')
                return response.status(400).json({message: "Update token error"});
            }

            await AuthRefreshToken.findByIdAndDelete(payload.id);

            // Check if the user and chat exist
            const localUser = await LocalUser.findById(payloadUserId);
            const chatRoom = await ChatRoom.findById(payloadChatId);
            if (!localUser || !chatRoom) {
                return response.status(400).json({message: "The user or the chat does not exist"});
            }

            const authTokens = await AuthorizationService.createAuthTokens(payload.user, payload.chat);
            response.status(200).json({message: "Token updated", data: authTokens});
        } catch (e) {
            console.log(e);
            response.status(400).json({message: "Update token error"});
        }
    }
}