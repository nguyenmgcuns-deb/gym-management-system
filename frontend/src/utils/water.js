import { toISODate } from './dates'

// Total ml drunk on a local day ("YYYY-MM-DD") from entries { amount, at }.
export function waterOn(entries, isoDate = toISODate()) {
  return entries
    .filter((e) => toISODate(new Date(e.at)) === isoDate)
    .reduce((sum, e) => sum + e.amount, 0)
}
