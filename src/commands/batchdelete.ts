import {BatchWriteCommand, BatchWriteCommandInput, BatchWriteCommandOutput} from "@aws-sdk/lib-dynamodb"
import {BatchCommand} from "./command"
import {Class, PrimaryKey} from "src/types"
import {Dynam0RMTable} from "src/table";

export class BatchDelete<T extends Dynam0RMTable> extends BatchCommand<BatchWriteCommandInput, BatchWriteCommandOutput> {
    protected commands: BatchWriteCommand[] = []

    constructor(target: Class<T>, Keys: PrimaryKey<T>[]) {
        super(target, Keys)
        if (this.inputs?.length) for (const input of this.inputs) {
            this.commands.push(new BatchWriteCommand({
                RequestItems: {
                    [this.tableName]: input.map((Key: {}) => ({
                        DeleteRequest: {Key}
                    }))
                }
            }))
        }
    }
}