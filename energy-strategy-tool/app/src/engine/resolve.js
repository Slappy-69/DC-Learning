// Condition resolver (work package 35, owner's decisions of 2026-11-12: a ticked condition re-runs the option;
// only conditions that already have a tick in the inputs can be resolved here). Pure: no UI.
//
// A tier B condition can be resolved by ticking the input it already reads (buildability.js):
//   third-party      -> plants.agreed[plant] = true           (owner has agreed in principle)
//   takeover-import  -> plants.importConfirmed[plant] = true  (grid operator confirmed import)
//   gas-supply       -> utilities.gasAvailable = 'Yes'         (only when availability is 'Unknown')
// Other conditions (unit count, no spare unit, land, the capacity of the gas network, country rules) need a design
// change, so they are not resolvable here. Returns { path, value, label } or null.

export function resolutionFor(cond, inputs) {
  if (!cond || !inputs) return null;
  if (cond.id === 'third-party' && cond.plant != null) {
    const agreed = (inputs.plants && inputs.plants.agreed) || {};
    return { path: 'plants.agreed', value: { ...agreed, [cond.plant]: true }, label: 'Mark the owner as agreed' };
  }
  if (cond.id === 'takeover-import' && cond.plant != null) {
    const confirmed = (inputs.plants && inputs.plants.importConfirmed) || {};
    return { path: 'plants.importConfirmed', value: { ...confirmed, [cond.plant]: true }, label: 'Mark import as confirmed' };
  }
  if (cond.id === 'gas-supply' && inputs.utilities && inputs.utilities.gasAvailable === 'Unknown') {
    return { path: 'utilities.gasAvailable', value: 'Yes', label: 'Mark gas as available' };
  }
  return null;
}
