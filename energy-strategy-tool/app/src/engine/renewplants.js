// A nearby renewable plant in the analysis (work package 33; owner 2026-11-07, OPEN-QUESTIONS 195; 2026-11-08 "Yes" to
// modelling it on the country's profile, OPEN-QUESTIONS 243). The plant ticked on the results is kept in the study as
// a snapshot (inputs.plants.renewables: id, name, type, MW, distance), so the run does not need the bundled list. Its
// hourly output follows the country's wind or solar profile scaled to its MW (hydro: flat at a capacity factor), not
// the plant's own measured output: flagged. Uses, one C23 value each: supply contract (rc:, once its price is entered),
// bought (rb:, at the price entered, blank = the tool's new-build cost of the type) and leased (rl:, once its rent is
// entered); by private wire or through the grid. The campus takes its output after its own on-site solar and wind;
// the rest stays with the plant, which keeps selling it (the campus keeps the share entered, blank = 0 %).

export const RENEW_HYDRO_CF = 0.5; // judgement: a flat run-of-river or reservoir output at half its capacity
const num0 = (x) => (x !== null && x !== undefined && x !== '' && Number.isFinite(Number(x)) ? Number(x) : null);
export const renewValue = { contract: (id) => `rc:${id}`, buy: (id) => `rb:${id}`, lease: (id) => `rl:${id}` };
export function parseRenewValue(val) {
  const m = /^(rc|rb|rl):(.+)$/.exec(String(val || ''));
  return m ? { id: m[2], mode: m[1] === 'rc' ? 'contract' : m[1] === 'rb' ? 'buy' : 'lease' } : null;
}
export const profileOf = (type) => (type === 'solar' ? 'solar' : type === 'wind' || type === 'windOff' ? 'wind' : 'flat');

// The ticked plants with their uses (from inputs.plants.renewEdits[id]); techCost: { solar, wind } €/kW new-build.
export function renewCandidates(inputs, techCost) {
  const P = (inputs && inputs.plants) || {};
  const list = Array.isArray(P.renewables) ? P.renewables : [];
  const edits = P.renewEdits || {};
  const period = inputs && inputs.economics ? inputs.economics.periodYears : 20;
  return list.map((r) => {
    const e = edits[r.id] || {};
    const mw = (num0(e.mw) ?? Number(r.mw)) || 0;
    const prof = profileOf(r.type);
    const method = e.contractMethod === 'market' ? 'market' : 'fixed';
    const kPrice = method === 'fixed' ? num0(e.contractPrice) : num0(e.contractAdder);
    const buyIn = num0(e.buyPricePerMW);
    const newBuild = (prof === 'solar' ? techCost.solar : techCost.wind) * 1000; // €/MW (hydro: the wind figure, judgement)
    return {
      id: r.id, name: r.name, type: r.type, typeLabel: r.typeLabel || r.type, km: Number(r.km) || 0, mwListed: Number(r.mw) || 0, mw, profile: prof,
      cf: prof === 'flat' ? (num0(e.capacityFactor) ?? RENEW_HYDRO_CF) : null,
      route: e.route === 'grid' ? 'grid' : 'wire',
      contract: { offered: kPrice !== null, method, price: num0(e.contractPrice), adder: num0(e.contractAdder), years: num0(e.contractYears) ?? period },
      buy: { offered: true, pricePerMW: buyIn ?? newBuild, basis: buyIn != null ? 'entered' : 'new-build cost of the type (indicative — unverified)' },
      lease: { offered: num0(e.leasePerMWMonth) !== null, perMWMonth: num0(e.leasePerMWMonth) },
      share: { contract: num0(e.surplusShareContract) ?? 0, buy: num0(e.surplusShareBuy) ?? 0, lease: num0(e.surplusShareLease) ?? 0 },
      surplusPrice: num0(e.surplusPrice),
      values: { contract: renewValue.contract(r.id), buy: renewValue.buy(r.id), lease: renewValue.lease(r.id) },
    };
  });
}
export const renewChoiceValues = (inputs, techCost) => renewCandidates(inputs, techCost).flatMap((c) => [
  ...(c.contract.offered ? [c.values.contract] : []), c.values.buy, ...(c.lease.offered ? [c.values.lease] : [])]);
export function renewLabel(c, mode) {
  const what = mode === 'contract' ? 'supply contract' : mode === 'buy' ? 'bought' : 'leased';
  return `${c.name} (${Math.round(c.mw)} MW ${String(c.typeLabel).toLowerCase()}, ${what}, ${c.route === 'grid' ? 'through the grid' : 'private wire'})`;
}
