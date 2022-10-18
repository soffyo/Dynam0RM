export const attributeTypes = [
    'string' as const,
    'number' as const,
    'binary' as const,
    'boolean' as const,
    'array' as const,
    'string-set' as const,
    'number-set' as const,
    'binary-set' as const,
    'object' as const,
    'null' as const
]

export function formatAttributeType(type: AttributeTypes) {
    switch (type) {
        case 'string': return 'S'
        case 'number': return 'N'
        case 'binary': return 'B'
        case 'boolean': return 'BOOL'
        case 'array': return 'L'
        case 'string-set': return 'SS'
        case 'number-set': return 'NS'
        case 'binary-set': return 'BS'
        case 'object': return 'MAP'
        case 'null': return 'NULL'
        default: return 
    }
}

export type AttributeTypes = (typeof attributeTypes) extends (infer T)[] ? T : never