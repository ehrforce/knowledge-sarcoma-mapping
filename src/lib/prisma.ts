import { PrismaClient } from '@prisma/client'

const prismaClientSingleton = () => {
    return new PrismaClient()
}

declare global {
    var prisma: undefined | ReturnType<typeof prismaClientSingleton>
}

export const prisma = () => {
    if (!globalThis.prisma) {
        globalThis.prisma = prismaClientSingleton()
    }
    return globalThis.prisma
}

export default prisma
