import React, { useRef, useState } from 'react';
import { readEpw, weatherSummary, hasWeather } from '../engine/weather.js';

// Hourly weather (owner 2026-10-30): upload an EPW file to replace the synthetic temperatures. The file is read on this
// computer; nothing is sent anywhere.
export default function WeatherField({ inputs, update }) {
  const fileRef = useRef(null);
  const [msg, setMsg] = useState('');
  const on = hasWeather(inputs);
  const ws = on ? weatherSummary(inputs) : null;
  const load = async (e) => {
    const f = e.target.files && e.target.files[0];
    e.target.value = '';
    if (!f) return;
    try {
      const r = readEpw(await f.text(), f.name);
      if (!r.ok) { setMsg(`Not loaded: ${r.error}`); return; }
      update('weather', { ...r.weather, notes: r.warnings });
      setMsg('');
    } catch (err) { setMsg(`Not loaded: ${err && err.message ? err.message : err}`); }
  };
  const clear = () => { update('weather', { source: 'none' }); setMsg('Weather file removed: the synthetic country profile is used.'); };
  return (
    <div className="field weather-field">
      <span className="label" id="weather-label">Hourly weather</span>
      <p className="small" aria-describedby="weather-label">
        {on
          ? <>Measured: {ws.text}.{ws.km != null && ws.km > 50 ? <strong> The station is more than 50 km from the pin: check that its climate is representative.</strong> : null}{Array.isArray(inputs.weather.notes) && inputs.weather.notes.length ? ` ${inputs.weather.notes.join(' ')}` : ''}</>
          : <>Synthetic country profile (made-up hourly temperatures, indicative — unverified). Upload an EPW weather file (EnergyPlus format, for example a TMYx or PVGIS file) to use measured weather for hourly PUE, the design load and the weather trigger.</>}
      </p>
      <div className="btn-row">
        <button type="button" className="chip-btn" onClick={() => fileRef.current && fileRef.current.click()}>{on ? 'Replace EPW file…' : 'Upload EPW file…'}</button>
        {on ? <button type="button" className="chip-btn" onClick={clear}>Use the synthetic profile</button> : null}
        <input ref={fileRef} type="file" accept=".epw,text/plain" className="sr-only" aria-label="EPW weather file" onChange={load} tabIndex={-1} />
      </div>
      {msg ? <p className="small" role="status">{msg}</p> : <p className="small sr-only" role="status" />}
    </div>
  );
}
