test("javascript", function() {
    function dot() {
        return new Proxy({}, {
            get(target, key) {
                if (!(key in target)) {
                    return target[key] = dot()
                }
                return Reflect.get(target, key)
            }
        })
    }
    const proxy = dot()
    proxy.name.v.s.d.g.h.e = "NAME A"
    proxy.name.v.H = "DDD"

    console.dir(proxy, { depth: null })
})