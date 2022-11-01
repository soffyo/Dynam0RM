import {Dynam0RMClient} from '../src'
import {TablesWM} from 'src/private'
import * as dynamoDBConfig from './dbconfig.json'

test('client', () => {
    const Dynam0RM = new Dynam0RMClient(dynamoDBConfig)
    const {Connection, HashKey, RangeKey} = Dynam0RM.Decorators

    @Connection({tableName: 'Some Table Name'})
    class Some extends Dynam0RM.Table {
        @HashKey
        a: string
        @RangeKey
        b: string
    }

    console.log(TablesWM(Some).all())
})
