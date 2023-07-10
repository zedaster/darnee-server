import express, {Express} from "express";
import dotenv from "dotenv"
import authRoutes from "./routes/authRoutes";
import mongoose from "mongoose";
import {Server} from "socket.io";
import {ChatSocketController} from "./controllers/ChatSocketController";
import * as http from "http";
import cors from "cors";
import {authorizeChatUsers} from "./middleware/authMiddleware";

dotenv.config();

connectMongoose({removeAll: false}).then(() => {
    setupServers();
});

async function connectMongoose(params: { removeAll: boolean }) {
    const MONGODB_URI = process.env.MONGODB_URI;
    if (!MONGODB_URI) {
        console.error('MONGODB_URI not specified');
        process.exit(1);
    }

    await mongoose.connect(MONGODB_URI).then(() => {
        console.log('MongoDB connected');
    });

    if (params.removeAll) {
        await dropAllCollections();
    }
}

function setupServers() {
    const app: Express = express();
    app.use(cors({
        origin: '*',
        methods: ['GET', 'POST']
    }));
    app.use(express.json());
    app.use('/auth', authRoutes);

    // const server = http.createServer(app);
    let port = 5000;
    if (process.env.SERVER_PORT) {
        port = parseInt(process.env.SERVER_PORT);
    } else {
        console.log('SERVER_PORT not specified, using default 5000');
    }
    const server = http.createServer(app)

    const io = new Server(server, {
        path: '/chat/',
        cors: {
            origin: '*',
            methods: ['GET', 'POST']
        }
    });
    io.use(authorizeChatUsers)
    new ChatSocketController(io)

    server.listen(port, () => {
        console.log(`Server listening on port ${port}`);
    });
}

async function dropAllCollections() {
    const collections = await mongoose.connection.db.collections();
    for (let collection of collections) {
        await collection.drop()
    }
}

// function generateSecretKey(){
//     return crypto.randomBytes(32).toString('hex');
// }

