import { getUniqueICD10Codes } from "./utils/icd10";
import { loadExcelICD10 } from "./excel/load";

/**
 * This is a minor hack! 
 * The anatomy map does not include C97. To make it present in the overall list of ICD10 codes we need to add it specific. 
 * 
 * Added as an array to make it simpler to add additional codes later if needed 
 */
const additionalCodes: string[] = ["C97"];
/**
 * 
 * @param mapping_file 
 * @param icd10_file 
 * @param additionalCodes 
 * @returns 
 */
export async function createICD10Knowledge(mapping_file: string | Buffer | ArrayBuffer, icd10_file: string | Buffer | ArrayBuffer) {
  const uniques = await getUniqueICD10Codes(mapping_file);
  const icdcodes = await loadExcelICD10(icd10_file);




  additionalCodes.forEach(c => {
    const exist = uniques.find(x => x == c);
    if (!exist) {
      uniques.push(c);
    }
  })



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
