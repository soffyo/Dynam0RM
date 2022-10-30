import {TablesWM} from 'src/private'
import {addToPrivateMapArray} from 'src/decorators/property/functions'
import {ignore} from 'src/private/symbols'

export function Ignore(prototype: Object, key: string) {
    addToPrivateMapArray(TablesWM, prototype.constructor, ignore, key)
}