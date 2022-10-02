import { Dynam0RX, Schema, partitionKey, sortKey } from "../src";
import { ListTablesCommand } from "@aws-sdk/client-dynamodb";
import * as dynamoDBConfig from "./dbconfig.json"
import operators from "../src/operators";
import * as symbols from "../src/definitions";

@Schema({ dynamoDBConfig })
class Query extends Dynam0RX<Query> {
    @partitionKey
    slug?: "slug" = "slug"
    @sortKey
    index: number
    content: string
}

test("paginator", async function() {
    const items = new Array(15000).fill(0).map((i, index) => new Query({ index, content: `this is the slug number ${index}` }))
    await Query.init()
    await Query.batchPut(items)
    console.log(await Query.scan())
    await Query.drop() 
})