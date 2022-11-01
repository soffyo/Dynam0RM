import {Dynam0RM} from "src/index"
import {Transaction} from 'src/commands/transaction/transactwrite'
import * as dynamoDBConfig from './dbconfig.json'
import 'src/operators'

test('Transaction', async function() {
    const {Connection, HashKey, RangeKey, TimeToLive, Local, Global} = Dynam0RM.Decorators

    @Connection({dynamoDBConfig})
    class TypeTest extends Dynam0RM.Table {
        @HashKey
        partitionkey: string
        @RangeKey
        sortkey: number
        content: string
        ttl?: number
    }

    const tests = Array(10).fill(0).map((z, i) => {
        const test = new TypeTest()
        test.partitionkey = 'test'
        test.sortkey = i
        test.content = `content number ${i}`
        return test
    })

    const trans = new Transaction(dynamoDBConfig)

    await TypeTest.createTable()

    await TypeTest.put(...tests)

    const newTest = new TypeTest()
    newTest.partitionkey = 'test trans'
    newTest.sortkey = 100
    newTest.content = 'content added with transaction'

    trans.table(TypeTest).put(newTest)
    trans.table(TypeTest).keys({test: [0, 1]}).delete()
    trans.table(TypeTest).keys({test: [3, 5]}).if({content: Contains('nu')}).update({content: Overwrite('some new content on 3,5')})
    trans.table(TypeTest).keys({test: [2, 4]}).update({content: Overwrite('some new content on 2,4')})

    const tr = await trans.executeTransaction()

    const scan = await TypeTest.scan()

    console.dir(scan, {depth: null})
})