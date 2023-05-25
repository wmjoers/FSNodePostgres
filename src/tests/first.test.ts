import { endConnectionPool, startConnectionPool } from '../database';
import { insertFriend, selectAllFriends, initFriends } from '../repository';
import dotenv from 'dotenv';

beforeAll(async () => {
    dotenv.config();
    startConnectionPool({
        host: process.env.DB_HOST,
        database: process.env.DB_DATABASE,
        port: Number(process.env.DB_PORT),
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD
    });
    await initFriends();
});

afterAll(async () => {
    await endConnectionPool();
});

test('Get friends', async () => {
    const friends = await selectAllFriends();
    expect(friends.length).toBe(3);
});

test('Add friend with nick', async () => {
    const name = 'Tomas';
    const nick = 'Tom';
    
    const newFriend = await insertFriend(name, nick);

    expect(newFriend.name).toBe(name);
    expect(newFriend.nick).toBe(nick);
    expect(newFriend.id).toBeGreaterThan(0);
});

test('Add friend without nick', async () => {
    const name = 'Lisa';
    
    const newFriend = await insertFriend(name, null);

    expect(newFriend.name).toBe(name);
    expect(newFriend.nick).toBeNull();
    expect(newFriend.id).toBeGreaterThan(0);
});

test('Get friends after inserts', async () => {
    const friends = await selectAllFriends();

    expect(friends.length).toBe(5);
    expect(friends[0].nick).not.toBeNull();
    expect(friends[1].nick).toBeNull();
});


