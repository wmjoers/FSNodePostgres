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
