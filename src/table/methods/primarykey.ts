import {Delete, Update} from 'src/commands'
import {Dynam0RMTable} from 'src/table'
import {Condition, PrimaryKey, Update as TUpdate, Class} from 'src/types'

interface StandardMethodsProps<T extends Dynam0RMTable> {
    constructor: Class<T>
    keys: PrimaryKey<T>[]
}

interface StandardMethodsChildProps<T extends Dynam0RMTable> extends StandardMethodsProps<T> {
    conditions: Condition<T>[]
}

export function primaryKeyMethods<T extends Dynam0RMTable>(props: StandardMethodsProps<T>) {
    let conditions: Condition<T>[] = []
    return {
        if(condition: Condition<T>) {
            conditions.push(condition)
            return {
                ...orLoop({...props, conditions}),
                ...executor({...props, conditions})
            }
        },
        ...executor({...props, conditions})
    }
}

function executor<T extends Dynam0RMTable>({constructor, keys, conditions}: StandardMethodsChildProps<T>) {
    return {
        update: (update: TUpdate<T>) => Promise.all(keys.map(key => new Update(constructor, key, update, conditions).send())),
        delete: () => Promise.all(keys.map(key => new Delete(constructor, key, conditions).send()))
    }
}

function orLoop<T extends Dynam0RMTable>(props: StandardMethodsChildProps<T>) {
    return {
        or(condition: Condition<T>) {
            props.conditions.push(condition)
            return {
                ...orLoop(props)
            }
        },
        ...executor(props)
    }
}