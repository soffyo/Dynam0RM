export class Dynam0RXError extends Error {
    constructor(message?: string) {
        super(`Dynam0RX: ${message}`)
        super.name = 'Dynam0RXError'
    }
}