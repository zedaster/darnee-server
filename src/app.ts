import express, {Express} from "express";
import dotenv from "dotenv"
import authRoutes from "./routes/authRoutes";
import mongoose from "mongoose";
import {Server} from "socket.io";
import {ChatSocketController} from "./controllers/ChatSocketController";
import * as http from "http";
import cors from "cors";
import {authorizeChatUsers} from "./middleware/authMiddleware";
import * as https from "https";
import * as fs from "fs";

dotenv.config();

class App {
    public readonly socketController: ChatSocketController;

    public static async initialize() {
        await App.connectMongoose({removeAll: false})
        return new App();
    }

    private constructor() {
        const {socketController} = this.setupServers();
        this.socketController = socketController;
    }

    private setupServers() {
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

        const options = {
            key: fs.readFileSync(process.env.CERT_KEY_PATH!),
            cert: fs.readFileSync(process.env.CERT_PEM_PATH!),
        }
        const server = https.createServer(options, app)

        const io = new Server(server, {
            path: '/chat/',
            cors: {
                origin: '*',
                methods: ['GET', 'POST']
            }
        });
        io.use(authorizeChatUsers)
        const socketController = new ChatSocketController(io)

        server.listen(port, () => {
            console.log(`Server listening on port ${port}`);
        });
        return {socketController};
    }

    private static async connectMongoose(params: { removeAll: boolean }) {
        const MONGODB_URI = process.env.MONGODB_URI;
        if (!MONGODB_URI) {
            console.error('MONGODB_URI not specified');
            process.exit(1);
        }

        await mongoose.connect(MONGODB_URI).then(() => {
            console.log('MongoDB connected');
        });

        if (params.removeAll) {
            await this.dropAllCollections();
        }
    }

    private static async dropAllCollections()  {
        const collections = await mongoose.connection.db.collections();
        for (let collection of collections) {
            await collection.drop()
        }
    }
}

const app = App.initialize();
export default app;
