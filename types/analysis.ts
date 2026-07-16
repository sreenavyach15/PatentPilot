import { Compound } from "./compound";
import { Patent } from "./patent";
import { PatentReport } from "./report";

export interface AnalysisResult {

  compound: Compound;

  patents: Patent[];

  report: PatentReport;

}