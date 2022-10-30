import { DeleteTableCommand, DeleteTableCommandInput, DeleteTableCommandOutput } from "@aws-sdk/client-dynamodb"
import { SimpleCommand } from "./command"
import { removeUndefined } from "src/utils"
import {Class} from "src/types";
import {Dynam0RMTable} from "src/table";

export class Drop extends SimpleCommand<DeleteTableCommandInput, DeleteTableCommandOutput> {
    protected command: DeleteTableCommand
    constructor(target: Class<Dynam0RMTable>) {
        super(target)
        this.command = new DeleteTableCommand({ TableName: this.tableName })
    }
}