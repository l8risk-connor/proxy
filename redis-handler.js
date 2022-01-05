const redis = require('redis');

class RedisHandler {
    constructor() {
        this.ip = '192.168.10.243';
        this.port = 6379;
        this.client = redis.createClient({
            url: `redis://${this.ip}:${this.port}`
        });
        this.client.on('error', (err) => console.log('Redis Client Error', err));
    }

    async init() {
        await this.client.connect();
        console.log('Redis Connected');
        return this;
    }

    async hGet(key) {
        return await this.client.hGet(key);
    }

    async hGetAll(key) {
        return await this.client.hGetAll(key);
    }
}

exports.RedisHandler = RedisHandler;