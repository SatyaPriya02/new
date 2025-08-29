// export function msToHMS(ms) {
//   const totalSec = Math.floor(ms / 1000);
//   const h = Math.floor(totalSec / 3600);
//   const m = Math.floor((totalSec % 3600) / 60);
//   const s = totalSec % 60;
//   return `${h}h ${m}m ${s}s`;
// }


// src/utils/time.js
export function msToHMS(ms) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const hh = String(Math.floor(s / 3600)).padStart(2, "0");
  const mm = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
  const ss = String(s % 60).padStart(2, "0");
  return `${hh}:${mm}:${ss}`;
}
