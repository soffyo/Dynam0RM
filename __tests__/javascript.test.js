test("javascript", function() {
    function dotNotationAssign() {
        return new Proxy({}, {
            get(target, key) {
                if (!(key in target)) {
                    return target[key] = dotNotationAssign()
                }
                return Reflect.get(target, key)
            }
        })
    } 
    
    const obj = dotNotationAssign()
    
    obj.a.b.c = "hello"
    
    console.log(obj)
})