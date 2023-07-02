import express, {Express} from "express";
import dotenv from "dotenv"
import chatRoutes from "./routes/chatRoutes";
import mongoose from "mongoose";

dotenv.config();

connectMongoose({removeAll: true}).then(() => {
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
    // app.use(cors());
    app.use(express.json());
    app.use('/chat', chatRoutes);

    // const server = http.createServer(app);
    let port = 5000;
    if (process.env.SERVER_PORT) {
        port = parseInt(process.env.SERVER_PORT);
    } else {
        console.log('SERVER_PORT not specified, using default 5000');
    }

    // const io = new Server(server, {
    //     cors: {
    //         origin: '*',
    //         methods: ['GET', 'POST']
    //     },
    //     path: '/chat/socket'
    // });
    // const chatSocketController = new ChatSocketController();
    // chatSocketController.setupServer(io);

    app.listen(port, () => {
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

