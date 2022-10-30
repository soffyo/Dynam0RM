import {GetCommand, GetCommandInput, GetCommandOutput} from '@aws-sdk/lib-dynamodb'
import {SimpleCommand} from 'src/commands/command'
import {Class, PrimaryKey} from "src/types"
import {Dynam0RMTable} from "src/table";

export class Get<T extends Dynam0RMTable> extends SimpleCommand<GetCommandInput, GetCommandOutput> {
    protected command: GetCommand
    public constructor(target: Class<T>, Key: PrimaryKey<T>) {
        super(target)
        this.command = new GetCommand({TableName: this.tableName, Key})
    }
}