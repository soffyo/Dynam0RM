'use strict'

function proxy (obj) {
    return new Proxy (obj, {
        get(target, key) {
            if (!(key in target) && key !== 'then' && typeof key === 'string') {
                Object.defineProperty(target, key, { value: proxy({}), configurable: true })
            }
            return Reflect.get(target, key)
        },
        set(target, key, receiver) {
            return Reflect.set(target, key, receiver)
        }
    })
}

const obj = proxy({})

if (obj.d.e.f) {}

obj.d.e.f = 'z'

obj.a.b.c = 'hello'

test('proxy', () => {
    console.log(obj.d.e.f)
})