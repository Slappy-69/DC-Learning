// Public engine API (pure functions, no UI).
export * from './defaults.js';
export * from './generator.js';
export * from './scoring.js';
export { runModel, rescore, mergeRuns, toTransferable, HOOKS, ENGINE_VERSION } from './run.js';
export { getProfiles, PROFILE_LABEL, nearestCountry, H } from './profiles.js';
export { buildContext, demandYear, gridCapByMonth } from './context.js';
export { sizeOption } from './sizing.js';
export { dispatchConfig, dispatchYear, dispatchAll, MERIT_ORDER } from './dispatch.js';
export { addMonths, monthsBetween } from './dates.js';
