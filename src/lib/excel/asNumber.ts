


export function asNumber(t: unknown): number {
    switch (typeof t) {
        case "number":
            return t;
        default:
            return -1;
    }
}
