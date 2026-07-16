import axios from "axios";
import { Compound } from "@/types/compound";

const BASE_URL = "https://pubchem.ncbi.nlm.nih.gov/rest/pug";

export async function getCompound(smiles: string): Promise<Compound> {
  try {
    // STEP 1: Get CID
    const cidResponse = await axios.get(
      `${BASE_URL}/compound/smiles/${encodeURIComponent(
        smiles
      )}/cids/JSON`
    );

    const cid =
      cidResponse.data.IdentifierList.CID[0];

    // STEP 2: Get Properties
    const propertyResponse = await axios.get(
      `${BASE_URL}/compound/cid/${cid}/property/MolecularFormula,CanonicalSMILES,IUPACName/JSON`
    );

    const property =
      propertyResponse.data.PropertyTable.Properties[0];

    // STEP 3: Get Synonyms
    let synonyms: string[] = [];

    try {
      const synonymResponse = await axios.get(
        `${BASE_URL}/compound/cid/${cid}/synonyms/JSON`
      );

      synonyms =
        synonymResponse.data.InformationList.Information[0]
          ?.Synonym ?? [];
    } catch {
      synonyms = [];
    }

    const commonName =
      synonyms.find(
        (s) =>
          /^[A-Za-z\s-]{4,25}$/.test(s) &&
          !/\d/.test(s)
      ) || property.IUPACName;

    return {
      cid,
      name: commonName,
      molecularFormula: property.MolecularFormula,

      canonicalSmiles:
        property.CanonicalSMILES?.trim() ||
        smiles,

      synonyms,
    };
  } catch {
    throw new Error("Unable to retrieve compound information.");
  }
}