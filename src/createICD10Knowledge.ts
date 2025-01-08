import { getUniqueICD10Codes } from ".";
import { loadExcelICD10 } from "./excel/load";

export async function createICD10Knowledge(mapping_file: string, icd10_file: string) {
  const uniques = await getUniqueICD10Codes(mapping_file);
  const icdcodes = await loadExcelICD10(icd10_file);
  return icd10MapData(uniques, icdcodes);


  function icd10MapData(uniques: string[], icdcodes: Record<string, string>) {
    type CodeSet = {
      code: string;
      name: string;
    };

    const result: CodeSet[] = [];
    uniques.forEach(c => {
      const i = icdcodes[c];
      if (i) {
        result.push({
          code: c.trim(), name: i.trim()
        });
      } else {
        console.warn(`The ICD10 code does not exist ${c}`);
      }
    });

    return result;
  }

}
