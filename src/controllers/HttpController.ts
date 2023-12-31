import {Request, Response} from "express";
import LocalUser from "../models/LocalUser";
import ChatRoom from "../models/ChatRoom";
import {validationResult} from "express-validator";
import {Types} from "mongoose";
import jwt, {JwtPayload} from "jsonwebtoken";
import AuthRefreshToken from "../models/AuthRefreshToken";
import AuthorizationService from "../services/AuthorizationService";
import {InviteLinkRequest} from "../middleware/inviteLinkMiddleware";
import app from "../app"

export class HttpController {
    async createRoom(request: Request, response: Response) {
        try {
            // TODO: Work with email and global user later
            const errors = validationResult(request);
            if (!errors.isEmpty()) {
                return response.status(400).json({
                    message: "Create room response error",
                    error_msg: errors.array()[0].msg
                });
            }

            const {username, email} = request.body
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

    async getInviteChatInfo(request: Request, response: Response) {
        try {
            const errors = validationResult(request);
            if (!errors.isEmpty()) {
                return response.status(400).json({
                    message: "Create room response error",
                    error_msg: errors.array()[0].msg
                });
            }

            const inviteRequest = request as InviteLinkRequest
            response.status(200).json({
                message: "Invite hash found",
                data: {chatId: inviteRequest.chatRoom.id}
            });
        } catch (e) {
            console.log(e);
        }
    }

    async joinRoom(request: Request, response: Response) {
        try {
            const errors = validationResult(request);
            if (!errors.isEmpty()) {
                return response.status(400).json({
                    message: "Create room response error",
                    error_msg: errors.array()[0].msg
                });
            }

            const {username, email} = request.body
            const inviteRequest = request as InviteLinkRequest;
            const {chatRoom} = inviteRequest;

            const localUser = new LocalUser({name: username})
            await localUser.save()
            chatRoom.users.push(localUser._id)
            await chatRoom.save()
            const authTokens = await AuthorizationService.createAuthTokens(localUser._id, chatRoom._id);
            (await app).socketController.emitUserJoinEvent(chatRoom.id, localUser.id, localUser.name);
            response.status(200).json({message: "User joined", data: authTokens});
        } catch (e) {
            console.log(e);
            response.status(400).json({message: "Join room error"});
        }

    }

    async updateToken(request: Request, response: Response) {
        try {
            const errors = validationResult(request);
            if (!errors.isEmpty()) {
                return response.status(400).json({
                    message: "Update token response error",
                    error_msg: errors.array()[0].msg
                });
            }

            const {refreshToken} = request.body;
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