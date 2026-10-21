import { getTermsTool } from "./terms.js";
import { getMpPhotoTool, getMpsTool, getMpTool, getMpVotingsTool } from "./mps.js";
import { getClubTool, getClubsTool } from "./clubs.js";
import { getCommitteeSittingsTool, getCommitteesTool, getCommitteeTool } from "./committees.js";
import { getInterpellationsTool, getInterpellationTool } from "./interpellations.js";
import { getPrintsTool, getPrintTool } from "./prints.js";
import { getProceedingsTool, getProceedingTool } from "./proceedings.js";
import { getProcessTool } from "./process.js";
import { getProcessesTool } from "./processes.js";
import { getTranscriptStatementTool, getTranscriptsTool } from "./transcripts.js";
import { getVideosTool } from "./videos.js";
import { getVotingsTool, getVotingTool, searchVotingsTool } from "./votings.js";
import { getWrittenQuestionsTool } from "./writtenQuestions.js";
import { getBilateralGroupsTool } from "./bilateralGroups.js";

export const tools = {
  "get-terms": getTermsTool,
  "get-members": getMpsTool,
  "get-member": getMpTool,
  "get-member-photo": getMpPhotoTool,
  "get-member-votings": getMpVotingsTool,
  "get-clubs": getClubsTool,
  "get-club": getClubTool,
  "get-committees": getCommitteesTool,
  "get-committee": getCommitteeTool,
  "get-committee-sittings": getCommitteeSittingsTool,
  "get-interpellations": getInterpellationsTool,
  "get-interpellation": getInterpellationTool,
  "get-prints": getPrintsTool,
  "get-print": getPrintTool,
  "get-proceedings": getProceedingsTool,
  "get-proceeding": getProceedingTool,
  "get-process": getProcessTool,
  "get-processes": getProcessesTool,
  "get-transcripts": getTranscriptsTool,
  "get-transcript-statement": getTranscriptStatementTool,
  "get-videos": getVideosTool,
  "get-votings": getVotingsTool,
  "get-voting": getVotingTool,
  "search-votings": searchVotingsTool,
  "get-written-questions": getWrittenQuestionsTool,
  "get-bilateral-groups": getBilateralGroupsTool,
};

/** "get-member-votings" -> "Get member votings" */
export function toolTitle(name: string): string {
  const words = name.replace(/-/g, " ");
  return words.charAt(0).toUpperCase() + words.slice(1);
}
