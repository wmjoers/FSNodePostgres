import dotenv from 'dotenv';
import { endConnectionPool, startConnectionPool } from './database';
import { insertFriend, selectAllFriends, initFriends } from './repository';

async function main(): Promise<void> {

    dotenv.config();

    startConnectionPool({
        host: process.env.DB_HOST,
        database: process.env.DB_DATABASE,
        port: Number(process.env.DB_PORT),
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD
    });

    await initFriends();
    
    await insertFriend('Tomas', 'Tom');

    const friends = await selectAllFriends();
    friends.forEach(friend => {
        console.log(friend.name, friend.nick ?? '(No nick)');
    });

    await endConnectionPool();
}

main();
