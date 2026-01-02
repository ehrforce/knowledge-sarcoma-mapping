


export function asString(t: unknown): string {
    switch (typeof t) {
        case 'string':
            if ("NON" == t) {
                return "";
            } else {
                return t;
            }

        case 'number':
            return t + ";";
        case 'bigint':
            return t + "";
        case 'boolean':
            return t + "";
        case 'symbol':
            return t.description + "";
        case 'undefined':
            return "";
        case 'object':
            return JSON.stringify(t);
        case 'function':
            return "FUNCTION";
    }

}
