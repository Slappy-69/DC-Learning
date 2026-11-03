// Plain words for the PDF report (work package 22, owner 2026-11-02: "Plain-language flags", "Shorter appendices";
// OPEN-QUESTIONS 147–152). A one-line headline for each flag (its full engine wording stays in Appendix F), plain names
// for the inputs, and which inputs apply to a run. Pure: no browser APIs.

import { monthLabel } from '../format.js';

const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const monthText = (start, m) => { const [y, k] = String(monthLabel(start, Number(m))).split('-').map(Number); return y && k ? `${MON[k - 1]} ${y}` : `month ${m}`; };
const cap = (s) => (s ? s[0].toUpperCase() + s.slice(1) : s);
const lower = (s) => (/^[A-Z][a-z]/.test(s) ? s[0].toLowerCase() + s.slice(1) : s);
const num = (s) => String(s).trim();

// One line for a flag, in plain words, with its figures. start: the analysis start (months are counted from it).
export function flagHeadline(f, start) {
  const m = String(f.message || '');
  const id = String(f.id || '').replace(/:.*/, '');
  let x;
  switch (id) {
    case 'permit-ied':
      x = /input ([\d,.]+) MWth\s*(?:≥|>=)\s*([\d,.]+) MWth/.exec(m);
      return x ? `Needs an environmental permit under IED: ${num(x[1])} MWth of combustion plant on site, over the ${num(x[2])} MWth threshold` : 'Needs an environmental permit under IED';
    case 'permit-mcp':
      x = /units of ([\d,.]+) MWth \((.+?)\) are within/.exec(m);
      return x ? `Medium combustion plant rules apply to the ${lower(x[2])} (${num(x[1])} MWth per unit)` : 'Medium combustion plant rules apply';
    case 'permit-outlook':
      x = /Permitting outlook: (.+?) \(([^;]+); ([^)]+)\): (\w+); ready month (\d+), needed month (\d+), (\d+) months?(?:'|’)? (late|float)/.exec(m);
      if (x) return `Permit for the ${lower(x[1])} (${x[3]}) is ${x[4]}: ready ${monthText(start, x[5])}, needed ${monthText(start, x[6])}${x[8] === 'late' ? `, ${x[7]} months late` : ''}`;
      return 'Permit timing to check';
    case 'permit-seveso-fuel':
      x = /([\d,.]+) t (.+?)\s*(?:≥|>=)\s*([\d,.]+) t/.exec(m);
      return x ? `Fuel store of ${num(x[1])} t of ${x[2]} is above the ${num(x[3])} t hazardous-substances (COMAH) threshold` : 'Fuel store above the hazardous-substances threshold';
    case 'permit-h2':
      x = /Hydrogen storage ([\d,.]+) t/.exec(m);
      return x ? `Hydrogen store of ${num(x[1])} t needs a hazardous-substances consent (threshold 5 t)` : 'Hydrogen store needs a hazardous-substances consent';
    case 'permit-stack':
      x = /Stack height ([\d.,]+) m above the ([\d.,]+) m height limit/.exec(m);
      return x ? `Stacks of ${x[1]} m would break the ${x[2]} m height limit` : 'Stacks above the height limit';
    case 'grid-shortfall':
      x = /up to ([\d.,]+) MW in months (\d+)[–-](\d+)/.exec(m);
      return x ? `Grid import below the design load by up to ${x[1]} MW, ${monthText(start, x[2])} to ${monthText(start, x[3])}` : 'Grid import below the design load at times';
    case 'grid-binding':
      x = /binding: ([\d,]+) h, ([\d,]+) MWh unmet/.exec(m);
      return x ? `The grid connection is full at times: ${x[2]} MWh not served over ${x[1]} hours` : 'The grid connection is full at times';
    case 'grid-charge-assumed':
      x = /would cost about (\S+ ?[mk]?)\b/.exec(m);
      return `Grid connection charge not entered, so 0 is used${x ? `; at the standard rate it would be about ${x[1]}` : ''}`;
    case 'ppa-import-limited': return 'Part of the PPA cannot be delivered because the grid connection is full';
    case 'ppa-above-load': return 'The PPA volume is above the campus load in many hours';
    case 'adequacy-short':
      x = /([\d,]+) MWh unmet over ([\d,]+) h/.exec(m);
      return x ? `Does not meet the power need in every hour: ${x[1]} MWh not served over ${x[2]} hours` : 'Does not meet the power need in every hour';
    case 'target-ttp':
      x = /missed by (\d+) months/.exec(m);
      return x ? `Misses the programme: full load ${x[1]} months late` : 'Misses the programme';
    case 'fuel-gas-assumed': return 'Gas supply assumed: confirm the capacity and the date with the gas network';
    case 'fuel-diesel-prime': return 'Diesel or HVO running as prime power: hard to permit';
    case 'fuel-h2-unavailable': return 'No hydrogen supply at these inputs';
    case 'res-gas': return 'Backup depends on the gas network during a grid outage';
    case 'res-bessups': return 'Battery-augmented UPS: an emerging approach to redundancy';
    case 'tech-nascent':
      x = /\(([^)]+)\)\s*$/.exec(m);
      return `${x ? x[1] : 'A technology in the option'} is not yet proven at scale`;
    case 'tech-late':
      x = /^(.+?): earliest availability \(month (\d+)\) after the full-load target date \(month (\d+)\)/.exec(m);
      return x ? `${x[1]} is not available before ${monthText(start, x[2])}, after the programme needs it (${monthText(start, x[3])})` : 'A technology arrives after the programme needs it';
    case 'tech-chp-no-credit': return 'CHP heat is not credited against the cooling load (the PUE is entered directly)';
    case 'grid-bess-peakshave': return 'The battery cannot hold the import within the grid connection on the design day';
    case 'bess-recharge': return 'The shortfall battery cannot recharge on the design day, so it does not count as firm supply';
    case 'data-unverified': return 'The result rests on unverified defaults and synthetic profiles';
    default: {
      let s = m.split(/(?<=\.)\s/)[0].replace(/\.$/, '');
      if (s.length > 140) s = `${s.slice(0, 137).replace(/\s+\S*$/, '')}…`;
      return cap(s);
    }
  }
}

// Plain names for the inputs (Appendix A and B). An input not listed gets its name from its key.
export const INPUT_NAMES = {
  'project.name': 'Project name', 'project.lat': 'Latitude', 'project.lon': 'Longitude', 'project.country': 'Country profile', 'project.currency': 'Currency shown', 'project.analysisStart': 'Analysis start', 'project.seed': 'Random seed',
  'site.areaHa': 'Site area', 'site.aspect': 'Site aspect ratio', 'site.setbackM': 'Boundary setback', 'site.heightLimitM': 'Height limit', 'site.softUsableBySolar': 'Soft exclusions usable by solar', 'site.roadsFraction': 'Roads and circulation share', 'site.pvRoofM2': 'Roof area for PV', 'site.pvGroundHa': 'Ground area for PV', 'site.offsiteLandHa': 'Off-site land available', 'site.offsiteDistanceKm': 'Distance to off-site land', 'site.groundConditions': 'Ground conditions', 'site.areaFromBoundary': 'Area taken from the boundary',
  'load.itMW': 'IT load at full build', 'load.estimateCoverage': 'Site coverage for the IT estimate', 'load.phases': 'Phases (handover date and IT)', 'load.rampStart': 'Ramp: share of a phase at handover', 'load.rampMonths': 'Ramp: months to full', 'load.utilisation': 'Average IT utilisation', 'load.workload': 'Workload', 'load.shape': 'Load shape', 'load.dailySwing': 'Daily swing',
  'load.pueAnnual': 'Annual PUE', 'load.pueMax': 'Maximum PUE (design day)', 'load.densityKWm2': 'White-space density', 'load.wue': 'Water use (WUE)', 'load.grossUp': 'Building gross-up', 'load.storeys': 'Storeys', 'load.storeyHeightM': 'Storey height', 'load.roofZoneM': 'Roof plant zone', 'load.coolingFactor': 'PUE overhead factor (sensitivity)', 'load.ancillaryFrac': 'Load outside the PUE',
  'load.aiTrainUtil': 'AI training: utilisation', 'load.aiTrainDip': 'AI training: checkpoint dip', 'load.aiTrainDipEveryH': 'AI training: hours between dips', 'load.aiTrainDipH': 'AI training: dip length', 'load.aiInfUtil': 'AI inference: utilisation', 'load.aiInfTrough': 'AI inference: night trough', 'load.aiInfPeakHour': 'AI inference: peak hour', 'load.aiInfWeekend': 'AI inference: weekend share',
  'load.flexMaxPct': 'Flexibility: maximum curtailment', 'load.flexHours': 'Flexibility: hours a year', 'load.flexTrigger': 'Flexibility: trigger', 'load.flexTriggerPrice': 'Flexibility: price trigger', 'load.flexTriggerCarbon': 'Flexibility: carbon trigger', 'load.flexTriggerTemp': 'Flexibility: temperature trigger', 'load.flexEventH': 'Flexibility: event length', 'load.flexNoticeH': 'Flexibility: notice', 'load.flexRecoveryH': 'Flexibility: recovery', 'load.flexCostPerMWh': 'Flexibility: cost', 'load.flexBatteryFixed': 'Flexibility battery: fixed size', 'load.flexBatteryHours': 'Flexibility battery: hours', 'load.flexBatteryMW': 'Flexibility battery: power', 'load.flexBatteryMWh': 'Flexibility battery: energy', 'load.flexBatteryResponse': 'Flexibility battery: responds first',
  'grid.nowMW': 'Grid import now', 'grid.fullMW': 'Grid import at full connection', 'grid.fullDate': 'Full connection date', 'grid.unknownNowMW': 'Grid now when not known', 'grid.unknownFullPerITMW': 'Full grid per MW of IT when not known', 'grid.unknownFullMonths': 'Months to full grid when not known', 'grid.steps': 'Grid steps between now and full', 'grid.exportMW': 'Export capacity', 'grid.exportFactor': 'Export price factor', 'grid.priceAdder': 'Network charges and levies', 'grid.priceMultiplier': 'Grid price factor', 'grid.carbonMultiplier': 'Grid carbon factor', 'grid.contractWaitMW': 'Contracted import (waiting options)', 'grid.contractBridgeMW': 'Contracted import (bridging options)', 'grid.contractExportMW': 'Contracted export', 'grid.connectionCharge': 'Grid connection charge', 'grid.dateUncertainty': 'Grid date range (sensitivity)',
  'utilities.gasAvailable': 'Gas available', 'utilities.gasDateMonths': 'Gas available after', 'utilities.gasPrice': 'Gas commodity price', 'utilities.hydrogenAvailable': 'Hydrogen available', 'utilities.waterAvailable': 'Water available', 'utilities.districtHeating': 'District heating nearby', 'utilities.reYieldFactor': 'Solar and wind yield factor', 'utilities.ppaInclude': 'Include a PPA', 'utilities.ppaType': 'PPA type', 'utilities.ppaCoverage': 'PPA coverage',
  'existing.include': 'Existing plant: include', 'existing.name': 'Existing plant: name', 'existing.type': 'Existing plant: type', 'existing.units': 'Existing plant: units', 'existing.unitMW': 'Existing plant: unit size', 'existing.availableDate': 'Existing plant: available from', 'existing.eff': 'Existing plant: efficiency', 'existing.msl': 'Existing plant: minimum stable load', 'existing.vomPerMWh': 'Existing plant: variable O&M', 'existing.leasePerKWMonth': 'Existing plant: lease rate', 'existing.linkCapex': 'Existing plant: connection to the campus', 'existing.closeYear': 'Existing plant: closes', 'existing.buyPerKW': 'Existing plant: purchase price', 'existing.refurbPerKW': 'Existing plant: refurbishment', 'existing.fomPerKW': 'Existing plant: fixed O&M', 'existing.buyExtraYears': 'Existing plant: life added when bought', 'existing.takeoverMW': 'Existing plant: grid connection taken over', 'existing.takeoverCostPerMW': 'Existing plant: takeover cost', 'existing.takeoverLagMonths': 'Existing plant: takeover after closure',
  'plants.auto': 'Gas plants near the site from the bundled list',
  'requirements.backedPct': 'Share of the load backed up', 'requirements.topology': 'Backup topology', 'requirements.autonomyH': 'Backup fuel autonomy', 'requirements.islanding': 'Islanding', 'requirements.upsMin': 'UPS ride-through', 'requirements.blockSize': 'Backup block size', 'requirements.catcherN': 'Blocks per catcher unit', 'requirements.carbonTarget': 'Carbon target', 'requirements.capexCeiling': 'Capex ceiling', 'requirements.maxRunHours': 'Maximum run hours', 'requirements.iedMWth': 'IED threshold', 'requirements.mcpMinMWth': 'Medium combustion plant: lower limit', 'requirements.mcpMaxMWth': 'Medium combustion plant: upper limit', 'requirements.sevesoH2t': 'Hydrogen hazardous-substances threshold', 'requirements.permitAllowanceM': 'Permitting allowance', 'requirements.sevesoFuelT': 'Fuel hazardous-substances threshold', 'requirements.testRunHours': 'Generator test hours', 'requirements.gensetPrimaryHours': 'Genset prime hours allowed', 'requirements.testRunLoad': 'Generator test load', 'requirements.bessUpsGensetFraction': 'Gensets behind a battery UPS', 'requirements.landTakeCeilingHa': 'Land take ceiling', 'requirements.noiseNightDbA': 'Night noise limit',
  'economics.periodYears': 'Evaluation period', 'economics.wacc': 'Discount rate (WACC, real)', 'economics.contingency': 'Contingency', 'economics.capexLow': 'Capex range: low', 'economics.capexHigh': 'Capex range: high', 'economics.carbonPrice': 'Carbon price', 'economics.carbonEscalation': 'Carbon price escalation', 'economics.capexFactor': 'Capex factor (sensitivity)', 'economics.bessCapexFactor': 'Battery capex factor (sensitivity)', 'economics.gridCapexFactor': 'Grid capex factor (sensitivity)', 'economics.elecEscalation': 'Electricity price escalation', 'economics.gasEscalation': 'Gas price escalation', 'economics.salvageFraction': 'Residual value at the end', 'economics.revenueExport': 'Count export revenue', 'economics.displayPeriods': 'Further periods shown',
  'weights.cost': 'Weight: cost', 'weights.carbon': 'Weight: carbon', 'weights.ttp': 'Weight: time-to-power', 'weights.deliverability': 'Weight: deliverability',
  'deliverability.emergingPenalty': 'Penalty: emerging technology', 'deliverability.nascentPenalty': 'Penalty: nascent technology', 'deliverability.majorFlagPenalty': 'Penalty: each major permitting flag', 'deliverability.minorFlagPenalty': 'Penalty: each minor permitting flag', 'deliverability.gasUnknownPenalty': 'Penalty: gas supply not known', 'deliverability.hydrogenPenalty': 'Penalty: hydrogen', 'deliverability.leadTimePenalty': 'Penalty: long lead time', 'deliverability.leadTimeThresholdM': 'Long lead time from', 'deliverability.pooledBackupRisk': 'Penalty: pooled backup',
  'settings.generationCap': 'Options screened (cap)', 'settings.gridHandling': 'Grid handling', 'settings.runHourHandling': 'Run-hour handling', 'settings.costMetric': 'Cost measure', 'settings.carbonMetric': 'Carbon measure', 'settings.rankCompliantFirst': 'Rank compliant options first', 'settings.screeningModel': 'Screening model', 'settings.rentalLeadMonths': 'Lease or hire starts before need', 'settings.timelineMonths': 'Timeline length',
  weather: 'Hourly weather',
};
export function inputName(path) {
  if (INPUT_NAMES[path]) return INPUT_NAMES[path];
  const k = String(path).split('.').pop();
  const w = k.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/MW|KW|M2|Ha|Km/g, (u) => ` ${u}`).replace(/\s+/g, ' ').trim().toLowerCase();
  return cap(w);
}

// Inputs that do not apply to a run, left out of the report's appendices (the study file keeps every one).
const RUN_INTERNAL = new Set(['settings.sampleAboveCap', 'settings.absoluteScaling', 'settings.hideDominated', 'settings.windSiteThresholdHa', 'settings.bridgeBessHours', 'settings.maxDispatchYears', 'settings.repDaysPerMonth', 'settings.verifyTop', 'settings.autonomyBasis', 'settings.layoutCellM', 'settings.layoutCellLargeM', 'settings.siteLayoutScope', 'settings.siteLayoutWorkLimit', 'settings.layoutLargeSiteHa', 'plants.edits', 'project.seed', 'economics.displayPeriods']);
export function inputApplies(path, I) {
  if (RUN_INTERNAL.has(path)) return false;
  const shape = String(I.load && I.load.shape || '');
  if (/^load\.aiTrain/.test(path)) return shape === 'aiTraining';
  if (/^load\.aiInf/.test(path)) return shape === 'aiInference';
  if (path === 'load.dailySwing') return shape === 'daily';
  const flexOn = I.choices && I.choices.C16 && (I.choices.C16.values || []).some((v) => v !== 'off');
  if (/^load\.flex/.test(path)) return !!flexOn;
  if (/^existing\./.test(path)) return !!(I.existing && I.existing.include);
  return true;
}
