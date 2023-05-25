import { getClient, releaseClient } from './database';
import { Friend, RowId } from './types';

export async function initFriends(): Promise<void> {
    const db = await getClient();

    try {
        await db.query(
            `CREATE TABLE IF NOT EXISTS friends(
                id serial NOT NULL,
                name text NOT NULL,
                nick text,
                PRIMARY KEY (id));`
        );
    
        await db.query('TRUNCATE friends;');
        await db.query('INSERT INTO friends (name, nick) VALUES ($1, $2)', ['Rasmus', 'Raz']);
        await db.query('INSERT INTO friends (name, nick) VALUES ($1, $2)', ['Pelle', null]);
        await db.query('INSERT INTO friends (name, nick) VALUES ($1, $2)', ['Kiwi', 'Pipowitch']);    
    }
    finally {
        releaseClient(db);
    }
}

export async function selectAllFriends(): Promise<Friend[]> {
    let result: Friend[];
    const db = await getClient();

    try {
        const dbresult = await db.query<Friend>('SELECT * from friends ORDER BY name;');
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
        const dbresult = await db.query<RowId>('INSERT INTO friends (name, nick) VALUES ($1, $2) RETURNING id', [name, nick]);

        if(dbresult.rowCount == 0) {
            throw new Error('Unable to create new friend');
        }

        newId = dbresult.rows[0];
    } finally {
        releaseClient(db);
    }

    return({id: newId.id, name, nick});
}