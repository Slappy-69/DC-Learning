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
export { paretoView, paretoFrontier, weightedPick, highestWeightedScore, paretoTableRows, dominatedLabel, defaultParetoAxes, paretoCanvasAbove, paretoDefaultDisplay, paretoTtpClasses, PARETO_AXES, PARETO_AXIS_LIST, PARETO_AXIS_GROUPS, TTP_RAMP_STEPS } from './pareto.js';
export { defaultView, viewSetting, tablePageSize, activeFilterChips, activeFilterCount, FLAG_FILTERS } from './view.js';
