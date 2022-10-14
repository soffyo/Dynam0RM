import { ScanCommand, ScanCommandInput, ScanCommandOutput } from "@aws-sdk/lib-dynamodb"
import { Dynam0RX } from "src/mixin"
import { SimpleCommand } from "./command"

interface ScanConfig<T> {
    Limit?: number,
    Attributes?: (keyof T)[]
    IndexName?: string
}

export class Scan<T> extends SimpleCommand<T, ScanCommandInput, ScanCommandOutput, T[]> {
    protected readonly command: ScanCommand
    public constructor(target: object, config?: ScanConfig<T>) {
        super(target)
        this.command = new ScanCommand({
            TableName: this.tableName,
            Limit: config?.Limit,
            IndexName: config?.IndexName,
            ProjectionExpression: config?.Attributes?.join(', '),
        })
    }
    public async exec() {
        try {
            const { Items } = await this.send()
            this.response.content = Items?.map(item => Dynam0RX.make(item)) as unknown as T[]
            this.response.message = 'Table scanned successfully.'
            this.response.ok = true
        } catch (error: any) {
            this.response.ok = false
            this.response.message = error.message
            this.response.error = error
        } finally {
            return this.response
        }
    }
}