import {Server} from "socket.io";
import {IMessage, isMessage} from "../models/Message";

export class ChatSocketController {
    private static CHAT_ID_LENGTH = 40;
    private static chat_ids = ['2ef7bde608ce5404e97d5f042f95f89f1c232871'];
    private static user_ids = ['2ef7bde608ce5404e97d5f042f95f89f1c232871'];
    private static chat_messages = new Map<string, Array<IMessage>>();

    setupServer(io: Server) {
        const CHAT_ID_LENGTH = ChatSocketController.CHAT_ID_LENGTH;
        const chat_ids = ChatSocketController.chat_ids;
        const user_ids = ChatSocketController.user_ids;
        const chat_messages = ChatSocketController.chat_messages;

        io.on('connection', (socket) => {
            console.log('a user connected')

            socket.on('disconnect', () => {
                console.log('user disconnected')
            });

            const chat_id = socket.handshake.query.chat_id;
            // if chat_id is not string or not in chat_ids
            if (typeof chat_id !== 'string' || chat_id.length != CHAT_ID_LENGTH || !chat_ids.includes(chat_id)) {
                socket.emit('connection_error', {message: 'invalid_chat_id'});
                socket.disconnect();
                return;
            }
            socket.join(chat_id);
            socket.emit('connection_success', {messages: chat_messages.get(chat_id) || []});

            socket.on('send_message', (message) => {
                console.log(message);
                if (!isMessage(message)) {
                    socket.emit('send_message_error', {message: 'invalid_message'});
                    return;
                }
                if (!chat_messages.has(message.chat_id)) {
                    socket.emit('send_message_error', {message: 'invalid_chat_id'});
                    return;
                }

                if (chat_messages.has(message.chat_id)) {
                    chat_messages.get(message.chat_id)!.push(message);
                } else {
                    chat_messages.set(message.chat_id, [message]);
                }

                socket.to(message.chat_id).emit('receive_message', message);
            })
        });
    }
}