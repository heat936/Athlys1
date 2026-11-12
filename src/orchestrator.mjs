import { createHash } from "node:crypto";
const SHA = /^[a-f0-9]{40}$/i;
export const TERMINAL = new Set(["passed","failed","startup_failure","build_failure","timeout","cancelled","cached","skipped","unavailable"]);
export function validateRun(run) {
  const errors=[];
  if (!run || typeof run !== "object") return ["run must be an object"];
  if (!run.runId || typeof run.runId !== "string") errors.push("runId is required");
  if (!run.repository || !/^[\w.-]+\/[\w.-]+$/.test(run.repository)) errors.push("repository must be owner/name");
  if (!SHA.test(run.commitSha ?? "")) errors.push("commitSha must be a full 40-character SHA");
  if (!run.ref || typeof run.ref !== "string") errors.push("ref is required");
  if (!run.policyVersion || typeof run.policyVersion !== "string") errors.push("policyVersion is required");
  if (!Array.isArray(run.requiredChecks) || run.requiredChecks.length === 0 || run.requiredChecks.some(x=>typeof x!=="string"||!x)) errors.push("requiredChecks must be a non-empty string array");
  if (new Set(run.requiredChecks ?? []).size !== (run.requiredChecks ?? []).length) errors.push("requiredChecks must be unique");
  return errors;
}
export function aggregateResults(run, results) {
  const errors=validateRun(run);
  if(errors.length) throw new TypeError(errors.join("; "));
  const byName=new Map((results??[]).map(r=>[r.name,r]));
  const checks=run.requiredChecks.map(name=>({name,...(byName.get(name)??{status:"unavailable",fresh:false,reason:"missing result"})}));
  const invalid=checks.filter(c=>!TERMINAL.has(c.status));
  if(invalid.length) throw new TypeError("unknown status for: "+invalid.map(x=>x.name).join(", "));
  const status=checks.some(c=>c.status==="startup_failure")?"startup_failure":
    checks.some(c=>c.status==="failed")?"failed":
    checks.some(c=>c.status==="build_failure")?"build_failure":
    checks.some(c=>c.status==="timeout")?"timeout":
    checks.some(c=>c.status==="cancelled")?"cancelled":
    checks.some(c=>c.status==="unavailable")?"incomplete":
    checks.some(c=>c.status==="skipped")?"incomplete":
    checks.some(c=>c.status==="cached"||c.fresh!==true)?"cached_only":"success";
  return {runId:run.runId,repository:run.repository,commitSha:run.commitSha,status,complete:checks.every(c=>c.status==="passed"&&c.fresh===true),checks};
}
function canonicalize(value) {\n  if (Array.isArray(value)) return value.map(canonicalize);\n  if (value && typeof value === "object") return Object.fromEntries(Object.keys(value).sort().map(key=>[key,canonicalize(value[key])]));\n  return value;\n}\nexport function createEvidenceManifest(run, results, runner) {
  const aggregate=aggregateResults(run,results);
  const payload={schemaVersion:"1.0",run:{runId:run.runId,repository:run.repository,ref:run.ref,commitSha:run.commitSha,policyVersion:run.policyVersion},runner,aggregate};
  const canonical=JSON.stringify(canonicalize(payload));
  return {...payload,integrity:{algorithm:"sha256",digest:createHash("sha256").update(canonical).digest("hex"),signed:false}};
}
