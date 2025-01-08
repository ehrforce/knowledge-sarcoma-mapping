import * as fs from 'fs';
import { SarkomKnowledgeDatabase } from './model';
import { KnowledgeManager } from './manager';

describe("Can load knowledge", ()=>{
    const data = loadDb() as SarkomKnowledgeDatabase;
    test("Db is loaded", ()=>{
        expect(data).not.toBeNull();
    })
})

describe("Knowledge Manager Test", ()=>{
    const data = loadDb() as SarkomKnowledgeDatabase;
    const manager = new KnowledgeManager(data);
    test("Some anatomy exist", ()=>{
        expect(manager.getAnatomyOrganCodes()).toBeDefined();
        expect(manager.getAnatomyLocationCodes().length).toBeGreaterThan(0);
    })
})


function loadDb(): SarkomKnowledgeDatabase{
const data = fs.readFileSync("./tmp.json", {encoding:"utf-8"});

return JSON.parse(data) as SarkomKnowledgeDatabase;
}
