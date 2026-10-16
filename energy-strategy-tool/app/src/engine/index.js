// Public engine API (pure functions, no UI).
export * from './defaults.js';
export * from './generator.js';
export * from './scoring.js';
export { runModel, runModelSteps, startPooledRun, rescore, mergeRuns, toTransferable, HOOKS, ENGINE_VERSION, PROGRESS_EVERY } from './run.js';
export * from './runlog.js';
export { getProfiles, PROFILE_LABEL, nearestCountry, H } from './profiles.js';
export { buildContext, demandYear, gridCapByMonth } from './context.js';
export { sizeOption } from './sizing.js';
export { dispatchConfig, dispatchYear, dispatchAll, MERIT_ORDER } from './dispatch.js';
export { addMonths, monthsBetween } from './dates.js';
export { paretoView, paretoFrontier, weightedPick, paretoTableRows, defaultParetoAxes, PARETO_AXES, TTP_CLASSES } from './pareto.js';
export { tornado, evaluateVector, TORNADO_DRIVERS } from './sensitivity.js';
export { axisScore } from './scoring.js';
export { layoutSite, siteGeometry, blockList, BLOCK_RULES } from './site.js';
