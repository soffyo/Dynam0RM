import {BatchGetCommandInput, BatchGetCommandOutput, BatchGetCommand} from '@aws-sdk/lib-dynamodb'

import {BatchCommand} from './command'
import {Class, PrimaryKey} from 'src/types'
import {Dynam0RMTable} from 'src/table'

export class BatchGetMono<T extends Dynam0RMTable> extends BatchCommand<BatchGetCommandInput, BatchGetCommandOutput> {
    protected commands: BatchGetCommand[] = []
    public constructor(target: Class<T>, Keys: (PrimaryKey<T>)[]) {
        super(target, Keys)
        if (this.inputs?.length) for (const input of this.inputs!) {
            this.commands.push(new BatchGetCommand({
                RequestItems: {
                    [this.tableName]: {
                        Keys: input
                    }
                }
            }))
        }
    }
}