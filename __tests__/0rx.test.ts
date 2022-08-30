import { Dynam0RX, partitionKey, sortKey, Schema } from "../src"
import operators, { equal, between, contains } from "../src/operators"
import * as dynamoDBConfig from "./dbconfig.json"

@Schema({ dynamoDBConfig })
class Test extends Dynam0RX {
    @partitionKey
    pk: string
    @sortKey
    sk: number
    string?: string
    number?: number
    bool?: boolean
    stringList?: string[]
    numberList?: number[]
    stringSet?: Set<string>
    numberSet?: Set<number>
    map?: {
        str?: string
        a?: {
            num?: number
            b?: {
                bool?: boolean
                c?: string
            }
        }
    }
}

@Schema({ dynamoDBConfig })
class QueryTest extends Dynam0RX<QueryTest> {
    @partitionKey
    readonly name: "slug" = "slug" 
    @sortKey
    id: number
    content?: string
}

const zero = new Test({
    pk: "ZERO",
    sk: 0,
    numberList: [1,2,3],
    stringList: ["a","b","c"],
    stringSet: new Set(["d","e","f"]),
    numberSet: new Set([4,5,6]),
    map: {
        a: {
            num: 30
        }
    }
})
const one = new Test()
one.pk = "ONE"
one.sk = 1
one.number = 10
one.numberList = [70,80,90]
one.stringList = ["G","H","I"]
one.numberSet = new Set([100,110,120])
one.stringSet = new Set(["J","K","L"])
one.map = {
    a: {
        
    }
}

test("0RX", async function() {
    /* const init = await Test.init()
    await one.save()
    await zero.put()
    zero.number = 9000
    zero.numberList = [2000,3000,4000,6789]
    zero.map!.a!.num = 50
    console.log(await zero.update({
        numberList: contains(20)
    }))
    one.number = 10.30
    one.string = "Saved updated string"
    await one.save()
    //console.dir(await Test.scan(), { depth: null })
    await Test.drop() */
})

test("QUERY", async function() {
    console.log((await QueryTest.init()).response)
    const items = new Array(101).fill(0).map((item, index) => new QueryTest({ id: index, content: "this is the content num." + index }))
    console.log((await QueryTest.batchPut(items)).response)
    const q = await QueryTest.query({ name: "slug" }, 10)
    q[9].content = "custom item content"
    q[9].save()
    console.dir(await QueryTest.query({ name: "slug", id: between(5,8) }))
    await QueryTest.drop()
})