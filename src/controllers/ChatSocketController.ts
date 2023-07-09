import {Server, Socket} from "socket.io";
import Message, {IMessage, isClientMessage} from "../models/Message";
import ChatRoom, {IChatRoomPopulated} from "../models/ChatRoom";
import LocalUser from "../models/LocalUser";

export class ChatSocketController {
    private io: Server;

    constructor(io: Server) {
        this.io = io;
        this.setupServer();
    }
    setupServer() {
        this.io.on('connection', async (socket) => {
            console.log('a user connected')

            socket.on('disconnect', () => {
                console.log('user disconnected')
            });

            // populate socket.data.chat
            const populateQuery = [
                {path: 'messages', model: Message},
                {path: 'users', model: LocalUser},
            ];
            const populatedChat = await ChatRoom
                .findById(socket.data.chatId)
                .populate<IChatRoomPopulated>(populateQuery)
                .exec();
            const messages = populatedChat?.messages;
            const users = populatedChat?.users;

            socket.emit('connection_success', {messages: messages?.toObject(), users: users?.toObject()});

            socket.on('send_message', (message) => this.handleSendMessage(socket, message));
        });
    }

    private async handleSendMessage(socket: Socket, clientMessage: any) {
        if (!isClientMessage(clientMessage)) {
            socket.emit('send_message_error', {message: 'invalid_message'});
            return;
        }
        const localUserId = socket.data.localUserId;
        const message: IMessage = {...clientMessage, sender: localUserId};

        const chatId = socket.data.chatId;
        const chat = await ChatRoom.findById(chatId);
        if (!chat) {
            socket.emit('send_message_error', {message: 'chat_not_found'});
            return;
        }
        const newMessage = new Message(message);
        await newMessage.save();
        chat.messages.push(newMessage._id);
        await chat.save();

        socket.to(chatId).emit('receive_message', message);
    }
}