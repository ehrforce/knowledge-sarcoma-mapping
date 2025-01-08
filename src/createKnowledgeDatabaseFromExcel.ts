import * as fs from "fs";
import { loadMorphologyFromExcel, loadAnatomyFromExcel } from "./excel/load";
import { SarkomKnowledgeDatabase } from "./model/model";

export async function createKnowledgeDatabaseFromExcel(f: string): Promise<SarkomKnowledgeDatabase> {
  try {
    const exist = fs.existsSync(f);
    if (exist) {
      const result = await loadMorphologyFromExcel(f);
      const anatomy = await loadAnatomyFromExcel(f);
      const db: SarkomKnowledgeDatabase = {
        generated: new Date(Date.now()).toISOString(),
        file: f,
        morphology: result.filter(x => x[1] == "x"),
        anatomy: anatomy
      };
      return db;
    } else {
      throw Error("Given files does not exist " + f);
    }
  } catch (error) {

    throw Error("Error loading knowledge from file " + f + ". Error " + error);

  }

}
