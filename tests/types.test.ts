import {Dynam0RM} from "src/index"
import {validateType} from "src/validation"
import {TablesWM} from "src/private"
import * as dynamoDBConfig from './dbconfig.json'

test('types', async function() {
    const {Connection, HashKey, RangeKey, TimeToLive, Local, Global} = Dynam0RM.Decorators

    @Connection({dynamoDBConfig})
    class TypeTest extends Dynam0RM.Table {
        @HashKey
        partitionkey: string
        @RangeKey
        sortkey: string
        content: number
        @TimeToLive
        ttl?: number
    }
})