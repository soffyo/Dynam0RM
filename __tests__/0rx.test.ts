import { Dynam0RX } from "../src"
import { PartitionKey, SortKey, Table } from '../src/decorators'
import operators, { Between } from "../src/operators"
import * as dynamoDBConfig from "./dbconfig.json"

@Table({ dynamoDBConfig })
class QueryTest extends Dynam0RX {
    @PartitionKey
    readonly name?: 'slug' = 'slug'
    @SortKey
    id: number
    content?: string
}

test("QUERY", async function() {
    console.log((await QueryTest.init()).message)
    const items = new Array(500).fill(0).map((item, index) => QueryTest.make({ id: index, content: `This is the content n. ${index}` }))
    console.log((await QueryTest.batchPut(items)).message)
    //const q = await QueryTest.query({ name: "slug" }, 10)
    //q.output[9].content = "custom item content"
    //await q.output[9].save()
    console.dir(await QueryTest.query({ name: 'slug', id: Between(238,242) }))
    await QueryTest.drop()
})