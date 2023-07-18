import mongoose from "mongoose";
import {MongoMemoryServer} from "mongodb-memory-server";

class TestDatabase {
    private readonly mongoServer;

    public static async create() {
        const mongoServer = await MongoMemoryServer.create();
        return new this(mongoServer);
    }

    private constructor(mongoServer: MongoMemoryServer) {
        this.mongoServer = mongoServer
    }

    public async connect() {
        const uri = this.mongoServer.getUri()
        await mongoose.connect(uri);
    }

    public async clear() {
        const collections = mongoose.connection.collections;
        for (const key in collections) {
            const collection = collections[key];
            await collection.deleteMany();
        }
    }

    public async close() {
        await mongoose.connection.dropDatabase();
        await mongoose.connection.close();
        await this.mongoServer.stop();
    }
}

export default TestDatabase.create()