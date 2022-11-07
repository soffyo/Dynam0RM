/**
 * @jest-environment ./tests/dynam0rm.env.ts
 */
import {Dynam0RMClient, Table} from '../src'
import {HashKey, RangeKey} from 'src/decorators/property/primarykey'
import * as config from './dbconfig.json'
import {makeRange} from '../src/utils'

const Dynam0RM = new Dynam0RMClient(config)

@Dynam0RM.Connection({TableName: 'BatchTest.X'})
class X extends Table {
    @HashKey
    pkx?: string = 'test'
    @RangeKey
    skx: number
}

@Dynam0RM.Connection({TableName: 'BatchTest.Y'})
class Y extends Table {
    @HashKey
    pky?: string = 'test'
    @RangeKey
    sky: number
}

beforeAll(async () => {
    await Promise.all([X.create(), Y.create()])

    const initialX = Array(200).fill(0)
        .map((z, i) => X.make({skx: i}))

    const initialY = Array(200).fill(0)
        .map((z, i) => Y.make({sky: i}))

    await Promise.all([X.batchPut(...initialX), Y.batchPut(...initialY)])
})

afterAll(async () => {
    await Promise.all([X.delete(), Y.delete()])
})

test('BatchWrite', async function () {
    const batchWrite = Dynam0RM.createBatchWrite()
    const batchGet = Dynam0RM.createBatchGet()

    const itemsX = Array(200).fill(0).map((z, i) => X.make({skx: i + 200}))
    const itemsY = Array(200).fill(0).map((z, i) => Y.make({sky: i + 200}))

    const tableX = batchWrite.selectTable(X)
    const tableY = batchWrite.selectTable(Y)

    tableX.addPutRequest(...itemsX)
    tableY.addPutRequest(...itemsY)

    tableX.addDeleteRequest({test: [...Array(200).keys()]})
    tableY.addDeleteRequest({test: [...Array(200).keys()]})

    const startWrite = Date.now()
    const write = await batchWrite.write()
    const writePerf = (Date.now() - startWrite) / 1000

    batchGet.selectTable(X).addGetRequest({test: makeRange(200, 399)})
    batchGet.selectTable(Y).addGetRequest({test: makeRange(200, 399)})

    const startGet = Date.now()
    const get = await batchGet.get()
    const getPerf = (Date.now() - startGet) / 1000

    let getLength = 0
    for (const out of get.output) {
        for (const response in out.Responses) {
            getLength += out.Responses[response].length
        }
    }

    write.output.forEach(o => expect(Object.keys(o.UnprocessedItems).length).toEqual(0))
    expect(getLength).toBe(400)

    console.log(`batchWrite took ${writePerf} seconds to process 400 items on 2 tables.`)
    console.log(`batchGet took ${getPerf} seconds to retrieve ${getLength} items from 2 tables. `)
})