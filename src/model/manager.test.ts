import * as fs from 'fs';
import { SarkomKnowledgeDatabase } from './model';
import { KnowledgeManager } from './manager';
import { createKnowledgeDatabaseFromExcel } from "../createKnowledgeDatabaseFromExcel";
import exp from 'constants';

describe("can-load-knowledge", () => {

    test("Db is loaded", async () => {
        const data = await loadDb();
        expect(data).not.toBeNull();
    })
})

describe("some-tests", () => {

    test("Some anatomy exist", async () => {
        const data = await loadDb();
        const manager = new KnowledgeManager(data);
        expect(manager.getAnatomyOrganCodes()).toBeDefined();
        expect(manager.getAnatomyLocationCodes().length).toBeGreaterThan(0);
    })
})

describe("verify-data", () => {
    const mydb = testbd();
    test("min-1000", async () => {
        const item = await mydb.code("1000");
        expect(item).not.toBeNull();
    })
    test("max-1177", async ()=>{
        const item = await mydb.code("1177");
        expect(item).not.toBeNull();
        expect(item?.description).toBe("Vagina");
    })
    test("kranium-1001", async()=>{
        const item = await mydb.code("1001");
        expect(item?.name).toBe("Kranium");
    })
    test("first-costa-1021", async()=>{
        const item = await mydb.code("1021");
        expect(item?.name).toBe("Første costa");
    })


})

function testbd() {
    let db: SarkomKnowledgeDatabase | undefined;
    let manager: KnowledgeManager | undefined = undefined;
    return {
        code: async (code: string) => {
            return (await getManager()).getAnatomyLocationCodes().find(x => x.code == `${KnowledgeManager.CODE_PREFIX_ANATOMY}${code}`);

        }
    }
    async function getManager(): Promise<KnowledgeManager> {
        if (manager == undefined) {
            db = await loadDb();
            manager = new KnowledgeManager(db);

        }
        return manager;
    }
}




async function loadDb(): Promise<SarkomKnowledgeDatabase> {
    const data = await createKnowledgeDatabaseFromExcel("./excel/mapping.xlsx");
    return data;

}
