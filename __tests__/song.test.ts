import { Schema, partitionKey, sortKey, localSecondaryIndex, globalSecondaryIndex } from '../src/decorators';
import op from '../src/operators';
import * as dynamoDBConfig from './dbconfig.json'
import { Dynam0RX } from 'src/mixin';
import * as symbol from '../src/definitions/symbols'

const myLocalIndex = new localSecondaryIndex<_table1>({ name: 'myindex' })
const myGlobalIndex = new globalSecondaryIndex<_table1>()

@Schema({ dynamoDBConfig })
class _table1 extends Dynam0RX {
    @partitionKey
    a1: string
    @sortKey
    b1: number
}

@Schema({ dynamoDBConfig })
class _table2 extends Dynam0RX {
    @partitionKey
    a2: string
    @sortKey
    b2: number
    c2?: string
}

@Schema({ dynamoDBConfig })
class _table3 extends Dynam0RX {
    @partitionKey
    a3: string
    @sortKey
    b3: number
    c3?: { a: number, b: { c: number }}
}

test('Song', async function() {
    await _table1.init()
    await _table2.init()
    await _table3.init()

    console.log(myLocalIndex.sortKey())

    const _1 = _table1.make({ a1: 'one', b1: 1 })
    const _2 = _table2.make({ a2: 'two', b2: 2 })
    const _3 = _table3.make({ a3: 'three', b3: 3 })

    void (await _1.save()).content.b1
    await _2.save()
    await _3.save()

    console.dir(await _table1.scan(), {depth: null})
    console.log(await _table2.scan())
    console.log(await _table3.scan())

    await _table1.drop()
    await _table2.drop()
    await _table3.drop()
})