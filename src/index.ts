import {TablesWM} from "src/private";
import {Dynam0RMTable} from 'src/table'
import {LocalSecondaryIndex, GlobalSecondaryIndex, IndexProps, GlobalIndexProps} from 'src/decorators/property/indexes'
import * as Decorators from 'src/decorators'

export abstract class Dynam0RM {
    public static Table = Dynam0RMTable
    public static Decorators = Decorators
    public static createLocalIndex<T extends Dynam0RMTable>(props?: IndexProps<T>) {
        return new LocalSecondaryIndex<T>(props)
    }
    public static createGlobalIndex<T extends Dynam0RMTable>(props?: GlobalIndexProps<T>) {
        return new GlobalSecondaryIndex<T>(props)
    }
}