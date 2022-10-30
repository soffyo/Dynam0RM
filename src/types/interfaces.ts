export interface CreateTableConfig {
    throughput?: {read: number; write: number}
    infrequent?: boolean
    stream?: 'new' | 'old' | 'both' | 'keys-only'
}