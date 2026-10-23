/* global __HOSTED__ */
// Saves bytes as a file through the browser's download (the Windows program turns it into a save dialog; see
// packaging/desktop/app/lib/guards.js). Never in the hosted page: a host's frame ignores downloads, and the build
// drops this code there (__HOSTED__ is written out at each use, as in RunProgress.jsx).
export function saveBytes(name, bytes, type) {
  if (__HOSTED__) return false;
  const blob = new Blob([bytes], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return true;
}
