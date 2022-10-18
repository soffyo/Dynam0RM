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
        return {
            get<T = any>(key: string|symbol) {
                if (wm.has(target)) return wm.get(target)[key] as T
                return undefined
            },
            all(): {[k: string|symbol]: unknown} | undefined {
                if (wm.has(target)) return wm.get(target)
                return undefined
            },
            set<T>(key: string|symbol, value: T): T {
                if (!wm.has(target)) wm.set(target, {})
                Object.defineProperty(wm.get(target), key, {
                    value,
                    enumerable: true,
                    configurable: true
                })
                return wm.get(target)[key]
            },
            delete(key: string|symbol) {
                if (wm.has(target)) delete wm.get(target)[key]
            },
            has(key: string|symbol) {
                if (wm.has(target) && key in wm.get(target)) {
                    return true
                }
                return false
            }
        }
    }
}