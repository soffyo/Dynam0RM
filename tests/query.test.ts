/**
 * @jest-environment ./tests/dynam0rm.env.ts
 */
import {Dynam0RMClient, Table} from '../src'
import {HashKey, RangeKey} from 'src/decorators/property/primarykey'
import {Between} from 'src/operators'
import * as config from './dbconfig.json'

const Dynam0RM = new Dynam0RMClient(config)

@Dynam0RM.Connection()
class Test extends Table {
    @HashKey
    readonly name?: 'slug' = 'slug'
    @RangeKey
    id: number
    content?: string
}

const items = new Array(10).fill(0).map((item, index) =>
    Test.make({id: index, content: `This is the content n. ${index}`}))

test('Query', async function() {
    await Test.create()
    await Test.batchPut(...items)

    await Test.query('slug', Between(10, 20)).scanBackward()
})
