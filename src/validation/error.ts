export class Dynam0RXError extends Error {
    constructor(message?: string) {
        super(message)
        super.name = 'Dynam0RXError'
    }
}