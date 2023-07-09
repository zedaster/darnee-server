import {Socket} from "socket.io";
import AuthorizationService from "../services/AuthorizationService";
import {Types} from "mongoose";
import ChatRoom from "../models/ChatRoom";

export async function authorizeChatUsers(socket: Socket, next: (err?: any) => void) {
    const token = socket.handshake.auth.token;
    if (typeof token !== 'string') {
        await next(new Error('No token provided'));
        return;
    }
    if (AuthorizationService.isValidAuthToken(token)) {
        const payload = AuthorizationService.getTokenPayload(token);
        const chatId = payload?.chat;
        const userId = payload?.user;
        if (payload === null || !Types.ObjectId.isValid(chatId) || !Types.ObjectId.isValid(userId)) {
            await next(new Error('Invalid token'));
            return;
        }
        // check if chat exists
        if (!(await ChatRoom.exists({_id: chatId, users: userId}))) {
            await next(new Error('You do not have access to this chat'));
            return;
        }

        socket.data.chatId = chatId;
        socket.data.localUserId = userId;
        socket.join(chatId)
        await next()
        return
    }
    next(new Error('Invalid token'));
}