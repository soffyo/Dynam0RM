import { DeleteCommand, DeleteCommandInput, DeleteCommandOutput } from "@aws-sdk/lib-dynamodb"
import { SimpleCommand } from "./command"
import { isObject } from "src/utils"
import { handleConditions } from "src/generators"
import { PrimaryKeys, Condition } from "src/types"
import * as symbols from "src/private/symbols"

export class Delete<T> extends SimpleCommand<DeleteCommandInput, DeleteCommandOutput, T> {
    protected command: DeleteCommand
    public constructor(target: { new (...args: any[]): {} }, Key: PrimaryKeys<T>, condition?: Condition<T>) {
        super(target)
        const ExpressionAttributeNames = {}
        const ExpressionAttributeValues = {}
        const Expressions: string[] = []
        if (condition) {
            void (function iterate(target: {[k:string|symbol]: any}, paths: string[]) {
                for (const key of Reflect.ownKeys(target)) {
                    const value = target[key]
                    let path = paths
                    if (typeof key === 'string') {
                        Object.defineProperty(ExpressionAttributeNames, `#${key}`, { value: key, enumerable: true })
                        path = paths.length > 0 ? [...paths, key] : [key]
                        if (isObject(value)) {
                            iterate(value, path)
                        }
                    } else if (typeof key === 'symbol' && Object.keys(symbols.condition).some(v => (symbols.condition as any)[v] === key)) {
                        handleConditions(key, value, path, ExpressionAttributeValues, Expressions)
                    }
                }
            })(condition, [])
        }
        this.command = new DeleteCommand({
            Key,
            TableName: this.tableName,
            ReturnValues: 'ALL_OLD',
            ExpressionAttributeNames: Object.keys(ExpressionAttributeNames).length > 0 ? ExpressionAttributeNames : undefined,
            ExpressionAttributeValues: Object.keys(ExpressionAttributeValues).length > 0 ? ExpressionAttributeValues : undefined,
            ConditionExpression: Expressions.length > 0 ? Expressions.join(' AND ') : undefined
        })
    }
    public async exec() {
        try {
            const { Attributes } = await this.send()
            this.response.output = Attributes as T
            this.response.message = 'Item deleted successfully'
            this.response.ok = true
        } catch (error: any) {
            this.response.ok = false
            this.response.message = error.message
            this.response.error = error.name
        } finally {
            return this.response
        }
    }
}