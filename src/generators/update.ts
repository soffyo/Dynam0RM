import * as operators from "src/definitions/symbols"

function attributeIterator(...args: any) {}

export function updateExpression(target: {[k:string]: any}) {
    const container_: {[K in ("add"|"delete"|"remove"|"update")]: string[]} = {
        add: [],
        delete: [],
        remove: [],
        update: [],
    }
    function symbols(key: symbol, value: any, path: string[], container: typeof container_) {
        const $name = path.join(".#")
        const $value = path.join("_")
        switch (key) {
            case operators.add: container.add.push(`#${$name} :${$value}_dynam0rx_add_update`)
                break
            case operators.Delete: container.delete.push(`#${$name} :${$value}_dynam0rx_delete_update`)
                break
            case operators.append: container.update.push(`#${$name} = list_append(#${$name}, :${$value}_dynam0rx_append_update)`)
                break
            case operators.prepend: container.update.push(`#${$name} = list_append(:${$value}_dynam0rx_prepend_update, #${$name})`)
                break
            case operators.increment: container.update.push(`#${$name} = #${$name} + :${$value}_dynam0rx_increment_update`)
                break
            case operators.decrement: container.update.push(`#${$name} = #${$name} - :${$value}_dynam0rx_decrement_update`)
                break
        }
    }
    function strings(key: string, value: any, path: string[], container: typeof container_) {
        const $name = path.join(".#")
        const $value = path.join("_")
        if (value === operators.remove) {
            container.remove.push(`#${$name}`)
        } else {
            container.update.push(`#${$name} = :${$value}_update`)
        }
    }
    attributeIterator(target, container_, symbols, strings)
    function extract(arr: string[]) {
        if (arr.length > 0) {
            return arr.join(", ")
        } else return ""
    }
    const remove = extract(container_.remove)
    const add = extract(container_.add)
    const update = extract(container_.update)
    const delete_ = extract(container_.delete)

    return `${update && "SET " + update} ${add && "ADD " + add} ${delete_ && "DELETE " + delete_} ${remove && "REMOVE " + remove}`
}