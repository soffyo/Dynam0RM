import { Dynam0RX } from "../src"
import { PartitionKey, SortKey, Table } from '../src/decorators'
import _ from "../src/operators"
import * as dynamoDBConfig from "./dbconfig.json"

@Table({ dynamoDBConfig })
class Test extends Dynam0RX {
    @PartitionKey
    readonly name?: 'slug' = 'slug'
    @SortKey
    id: number
    content?: string
}

test("QUERY", async function() {
    const items = new Array(500).fill(0).map((item, index) => Test.make({ id: index, content: `This is the content n. ${index}` }))
    console.log((await Test.createTable()).message)
    console.log((await Test.batchPut(items)).message)
    const query = await Test.query({ name: 'slug', id: _.Between(0,10) }).scanforward({ Limit: 3 })
    await Test.destroy()
})