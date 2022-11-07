import {DescribeTableCommand, DescribeTableCommandInput, DescribeTableCommandOutput} from '@aws-sdk/client-dynamodb'
import {SimpleCommand} from 'src/commands/command'
import {Dynam0RMTable} from 'src/table'
import {Class} from 'src/types'

export class DescribeTable<T extends Dynam0RMTable> extends SimpleCommand<DescribeTableCommandInput, DescribeTableCommandOutput> {
    protected command: DescribeTableCommand

    constructor(target: Class<T>) {
        super(target)
        this.command = new DescribeTableCommand({TableName: this.tableName})
    }
}