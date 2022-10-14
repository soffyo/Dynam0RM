export class PrivateMap {
    readonly #wm: WeakMap<object, any>
    readonly #target: object
    constructor(target: object) {
        this.#target = target
        this.#wm = new WeakMap()
        this.#wm.set(this.#target, {})
        Object.freeze(this)
    }
    set(key: string|symbol, value: any) {
        Object.defineProperty(this.#wm.get(this.#target), key, {
            value,
            configurable: true
        })
    }
    get(key: string|symbol) {
        return this.#wm.get(this.#target)[key]
    }
    delete(key: string|symbol) {
        delete this.#wm.get(this.#target)[key]
    }
    has(key: string|symbol) {
        if (key in this.#wm.get(this.#target)) {
            return true
        }
        return false
    }
}

export function createPrivateMap() {
    const wm = new WeakMap()
    return function(target: object) {
        if (!wm.has(target)) wm.set(target, {})
        return {
            set(key: string|symbol, value: any) {
                Object.defineProperty(wm.get(target), key, {
                    value,
                    enumerable: true,
                    configurable: true
                })
            },
            get<T = any>(key: string|symbol) {
                return wm.get(target)[key] as T
            },
            all() {
                return wm.get(target)
            },
            delete(key: string|symbol) {
                delete wm.get(target)[key]
            },
            has(key: string|symbol) {
                if (key in wm.get(target)) {
                    return true
                }
                return false
            }
        }
    }
}