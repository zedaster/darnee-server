// middleware to check if the invite link is valid
import InviteLink, {IInviteLinkDocument} from "../models/InviteLink";
import ChatRoom, {IChatRoomDocument} from "../models/ChatRoom";
import {NextFunction, Request, RequestHandler, Response} from "express";

export type InviteLinkRequest = Request & { inviteLink: IInviteLinkDocument, chatRoom: IChatRoomDocument }

export function handleInviteLinkHash(method: 'get' | 'post') : RequestHandler {
    let getInviteHash: (r: Request) => string;
    switch (method) {
        case "get":
            getInviteHash = (r) => r.query.inviteHash as string
            break
        case "post":
            getInviteHash = (r) => r.body.inviteHash as string
    }

    return async function(request: Request, response: Response, next: NextFunction) {
        try {
            const inviteHash = getInviteHash(request)
            const inviteLink = await InviteLink.getOneByHash(inviteHash)
            if (!inviteLink) {
                return response.status(400).json({message: "No such invite link"});
            }
            const chatId = inviteLink.chatRoom
            // find the chat room
            const chatRoom = await ChatRoom.findById(chatId)
            if (!chatRoom) {
                return response.status(400).json({message: "No such chat room"});
            }
            const inviteRequest = request as InviteLinkRequest
            inviteRequest.inviteLink = inviteLink
            inviteRequest.chatRoom = chatRoom
            next()
        } catch (e) {
            console.log(e);
        }
    }
}
