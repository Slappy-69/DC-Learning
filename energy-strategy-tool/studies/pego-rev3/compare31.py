# Pego study: revision 3 against revision 3.1 (the same scripts on the fixed engine). Writes out/compare31.json.
import json, pathlib
HERE = pathlib.Path(__file__).resolve().parent
OLD = HERE.parent / 'pego3' / 'out'
NEW = HERE / 'out'
J = lambda d, p: json.load(open(d / p))
so, sn = J(OLD, 'strategies.json'), J(NEW, 'strategies.json')
lo, ln = J(OLD, 'lead.json'), J(NEW, 'lead.json')
ro, rn = J(OLD, 'base-full.json'), J(NEW, 'base-full.json')
out = {'strategies': {}, 'lead': {}, 'run': {}}
for case in sn:
    if case not in so: continue
    out['strategies'][case] = {}
    for k, n in sn[case].items():
        o = so[case].get(k)
        if not o: continue
        out['strategies'][case][k] = {'old': {'lcoe': o['lcoe'], 'capex': o['capex'], 'loc': o['loc'], 'adequate': o['adequate'], 'npv': o['npv']},
                                      'new': {'lcoe': n['lcoe'], 'capex': n['capex'], 'loc': n['loc'], 'adequate': n['adequate'], 'npv': n['npv']}}
out['lead'] = {'old': {'id': lo['id'], 'name': lo['name'], 'lcoe': lo['eco']['lcoe'], 'capex': lo['eco']['capex'], 'npv': lo['eco']['npv'], 'loc': lo['carbon']['locationG']},
               'new': {'id': ln['id'], 'name': ln['name'], 'lcoe': ln['eco']['lcoe'], 'capex': ln['eco']['capex'], 'npv': ln['eco']['npv'], 'loc': ln['carbon']['locationG']}}
out['run'] = {'old': {'adequate': ro['adequate'], 'seconds': ro['seconds'], 'top5': [c['summary']['name'] for c in ro['cards']], 'runFlags': [f['id'] for f in ro['runFlags']]},
              'new': {'adequate': rn['adequate'], 'seconds': rn['seconds'], 'top5': [c['summary']['name'] for c in rn['cards']], 'runFlags': [f['id'] for f in rn['runFlags']]}}
json.dump(out, open(NEW / 'compare31.json', 'w'), indent=1)
for case, d in out['strategies'].items():
    print(case)
    for k, x in d.items():
        print(f"  {k:12s} {x['old']['lcoe']:7.1f} -> {x['new']['lcoe']:7.1f}  capex {x['old']['capex']/1e6:6.0f} -> {x['new']['capex']/1e6:6.0f}  {'A' if x['old']['adequate'] else '-'}{'A' if x['new']['adequate'] else '-'}")
print('lead', out['lead'])
print('run', out['run'])
