import { saveFantasyCalcData } from "./server/fantasyCalcStore";

export async function fetchAndStoreFantasyCalcData() {
  const formats = ["dynasty", "redraft"];
  const qbSettings = [
    { key: "1qb", isSuperflex: false },
    { key: "sf", isSuperflex: true },
  ];

  const allValues = {};

  for (const format of formats) {
    for (const qb of qbSettings) {
      const isDynasty = format === "dynasty";
      const numQbs = qb.isSuperflex ? 2 : 1;

      const url = `https://api.fantasycalc.com/values/current?isDynasty=${isDynasty}&numQbs=${numQbs}&numTeams=12&ppr=1`;

      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`FantasyCalc API failed for ${format}/${qb.key} → ${res.status}`);
      }

      const json = await res.json();
      allValues[`${format}_${qb.key}`] = json;
    }
  }

  saveFantasyCalcData(allValues);
  return allValues;
}
