import * as fs from 'fs';
import { SarkomKnowledgeDatabase } from './model';
import { KnowledgeManager } from './manager';
import { createKnowledgeDatabaseFromExcel } from '..';

describe("Can load knowledge", async ()=>{
    const data = await loadDb();
    test("Db is loaded", ()=>{
        expect(data).not.toBeNull();
    })
})

describe("Knowledge Manager Test", async ()=>{
    const data =  await loadDb();
    const manager = new KnowledgeManager(data);
    test("Some anatomy exist", ()=>{
        expect(manager.getAnatomyOrganCodes()).toBeDefined();
        expect(manager.getAnatomyLocationCodes().length).toBeGreaterThan(0);
    })
})


async function loadDb():Promise<SarkomKnowledgeDatabase>{
    const data =  await createKnowledgeDatabaseFromExcel("./excel/mapping.xlsx");
    return data;

}
