import { type } from '../../js-types/src'

class Schema {
    someprop = type.string
    someotherprop = type.number
}

new Schema().someotherprop = 'ds'