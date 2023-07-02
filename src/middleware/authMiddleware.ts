import {Server} from "socket.io";

export function checkAuthorization(socket: Server, next: (err?: any) => void) {
    // TODO: Implement checkAuthorization middleware
    // const authorization = request.headers.authorization;
    // if (!authorization) {
    //     response.status(401).json({message: 'unauthorized'});
    //     return;
    // }
    // const token = authorization.split(' ')[1];
    // if (!token) {
    //     response.status(401).json({message: 'unauthorized'});
    //     return;
    // }
}