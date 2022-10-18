import * as symbols from 'src/private/symbols'
import { isOwnSymbol, isQuerySymbol } from 'src/validation/symbols'

test('this', function() {
    console.log( isQuerySymbol(symbols.contains) )
})