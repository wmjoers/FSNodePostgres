# From Scratch - Node.js postgres connection

## CLI tools
* Node Version Manager (nvm)
* Node.js (node, npm, npx)
## Base repository
* https://github.com/wmjoers/FSNodeApp/
## Node.js packages
* Postgres (pg, @types/pg)

---
## Install Node Version Manager (nvm)
Read more about how to install nvm here: https://github.com/nvm-sh/nvm

This is an example of how to install nvm on MacOS:
```
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.3/install.sh | bash
```
```
nvm --version
```
---
## Install Node.js (node, npm, npx)
```
nvm install --lts
nvm ls
nvm use 18
```
```
node --version
npm --version
```
---

## Clone FSNodeApp
```
mkdir FSNodeWebservice
git clone https://github.com/wmjoers/FSNodeApp.git FSSimplePGMigration
cd FSSimplePGMigration
rm -rf .git
npm install
npm run test
```
Edit the file package.json to change name, version and description.

Read more aboute package.json here: https://docs.npmjs.com/cli/v9/configuring-npm/package-json

---
## Install Node.js packages
```
npm install pg
npm install @types/pg --save-dev
```
---
## Optional: Create database in Docker
You can read more about and install docker from here: https://www.docker.com/
```
docker pull postgres
docker run --name my_database -e POSTGRES_PASSWORD=justfortest -p 5432:5432 -d postgres
```
If you want to delete the database use:
```
docker stop my_database
docker rm my_database
```

---
## Edit .env
Clear the file and add the following lines:
```
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=my_database
DB_USER=postgres
DB_PASSWORD=justfortest
```

---
## Create and edit database.ts
Add the following:
```
import { Pool, PoolClient, PoolConfig } from 'pg';

let pool: Pool|undefined = undefined;

export function startConnectionPool(config: PoolConfig): void {
    if(pool !== undefined) {
        throw new Error('Connection pool is already started');
    }
    pool = new Pool(config);
}

export async function getClient(): Promise<PoolClient> {
    if(pool === undefined) {
        throw new Error('Connection pool is not started');
    }
    return await pool.connect();
}

export function releaseClient(client: PoolClient): void {
    client.release();
}

export async function endConnectionPool(): Promise<void> {
    if(pool !== undefined) {
        await pool.end();
        pool = undefined;
    }    
}
```

---
## Create and edit types.ts
Add the following:
```
export interface RowId {
    id: number;
}

export interface Friend {
    id: number;
    name: string;
    nick: string|null;
}
```

---
## Create and edit repository.ts
Add the following:
```
import { getClient, releaseClient } from './database';
import { Friend, RowId } from './types';

export async function initFriends(): Promise<void> {
    const db = await getClient();

    try {
        await db.query(
            `CREATE TABLE IF NOT EXISTS public.friends(
                id serial NOT NULL,
                name text NOT NULL,
                nick text,
                PRIMARY KEY (id));`
        );
    
        await db.query('TRUNCATE public.friends;');
        await db.query('INSERT INTO public.friends (name, nick) VALUES ($1, $2)', ['Rasmus', 'Raz']);
        await db.query('INSERT INTO public.friends (name, nick) VALUES ($1, $2)', ['Pelle', null]);
        await db.query('INSERT INTO public.friends (name, nick) VALUES ($1, $2)', ['Kiwi', 'Pipowitch']);    
    }
    finally {
        releaseClient(db);
    }
}

export async function selectAllFriends(): Promise<Friend[]> {
    let result: Friend[];
    const db = await getClient();

    try {
        const dbresult = await db.query<Friend>('SELECT * from public.friends ORDER BY name;');
        result = dbresult.rows;
    }
    finally {
        releaseClient(db);
    }
    
    return result;
}

export async function insertFriend(name: string, nick: string|null): Promise<Friend> {
    let newId:RowId = { id: -1 }; 
    const db = await getClient();
    
    try {        
        const dbresult = await db.query<RowId>('INSERT INTO public.friends (name, nick) VALUES ($1, $2) RETURNING id', [name, nick]);

        if(dbresult.rowCount == 0) {
            throw new Error('Unable to create new friend');
        }

        newId = dbresult.rows[0];
    } finally {
        releaseClient(db);
    }

    return({id: newId.id, name, nick});
}
```

---
## Edit index.ts
Clear the file and add the following:
```
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
```

---
## Edit tests/first.test.ts
Clear the file and add the following:
```
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
```
