'use strict'

function printargs(...args) {
    console.log(args)
}

test('proxy', () => {
    printargs(0, 1, 2, 3)
})