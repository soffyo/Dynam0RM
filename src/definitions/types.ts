export const attributeTypes = [
    "string" as const, "S" as const,
    "number" as const, "N" as const,
    "binary" as const, "B" as const,
    "boolean" as const, "BOOL" as const,
    "array" as const, "L" as const,
    "string set" as const, "SS" as const,
    "number set" as const, "NS" as const,
    "binary set" as const, "BS" as const,
    "map" as const, "MAP" as const,
    "null" as const, "NULL" as const
]

export type AttributeTypes = typeof attributeTypes extends Array<infer T> ? T : never