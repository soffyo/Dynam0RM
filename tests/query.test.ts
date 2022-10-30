import {Dynam0RM} from "../src"
import * as dynamoDBConfig from "./dbconfig.json"
import 'src/operators'


const {Connection, HashKey, RangeKey} = Dynam0RM.Decorators

@Connection({ dynamoDBConfig })
class Test extends Dynam0RM.Table {
    @HashKey
    readonly name?: 'slug' = 'slug'
    @RangeKey
    id: number
    content?: string
}

test("QUERY", async function() {
    const items = new Array(1000).fill(0).map((item, index) => Test.make({id: index, content: `This is the content n. ${index}`}))
    await Test.createTable()
    await Test.putItems(...items)
    const query = await Test.keys({slug: '100'}).get()
    console.log(query.output)
    await Test.destroy()
})