import { UpdateCommand, UpdateCommandInput, UpdateCommandOutput } from "@aws-sdk/lib-dynamodb"
import { isObject } from "src/utils"
import { BatchCommand } from "./command"

export class Save<T> extends BatchCommand<T, UpdateCommandInput, UpdateCommandOutput> {
    protected readonly commands: UpdateCommand[] = []
    public constructor(target: { new (...args: any[]): {} }, Key: {[k:string]: any}, update: {[k:string]: any}) {
        super(target)
        const iterate = (object: {[k:string]: any}, paths: string[] = []) => {
            let ExpressionAttributeValues: {[k:string]: any} | undefined
            let ExpressionAttributeNames: {[k:string]: any} | undefined
            let UpdateExpressions: string[] | undefined
            if (Object.keys(object).length > 0) {
                ExpressionAttributeNames = {}
                ExpressionAttributeValues = {}
                UpdateExpressions = []
                for (const [key, value] of Object.entries(object)) {
                    Object.defineProperty(ExpressionAttributeNames, `#${key}`, { value: key, enumerable: true })
                    let path = [key]
                    if (paths.length > 0 ) {
                        path = [...paths, key]
                        for (const k of paths) {
                            Object.defineProperty(ExpressionAttributeNames, `#${k}`, { value: k, enumerable: true })
                        }
                    }
                    const $path = path.join(".#")
                    UpdateExpressions.push(`#${$path} = :${key}`)
                    if (isObject(value)) {
                        Object.defineProperty(ExpressionAttributeValues, `:${key}`, { value: {}, enumerable: true })
                        iterate(value, path)
                    } else {
                        Object.defineProperty(ExpressionAttributeValues, `:${key}`, { value, enumerable: true })
                    }
                }
            }
            const command = new UpdateCommand({
                TableName: this.tableName,
                Key,
                ExpressionAttributeNames,
                ExpressionAttributeValues,
                UpdateExpression: UpdateExpressions && 'SET ' + UpdateExpressions.join(", "),
                ReturnValues: 'ALL_NEW'
            }) 
            return command && this.commands.push(command)
        }
        iterate(update)
        this.commands.reverse()
    }
    public async send() {
        const responses: UpdateCommandOutput[] = []
        for (const command of this.commands) {
            responses.push(await this.dynamoDBDocumentClient.send(command))
        }
        return responses
    }
    public async exec() {
        try {
            const responses = await this.send()
            const { Attributes } = responses[responses.length - 1]
            if (Attributes) this.response.output = Attributes as T
            this.response.message = 'Item saved succesfully.'
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