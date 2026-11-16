// human readable rates
// converting from 1000x to 
function rounded(value, precision) {
  const scale = 10**precision;
  return Math.round(value * scale) / scale;
}

function _plural(word: string, pluralize: boolean) {
  return pluralize ? `${word}s` : word;
}

const unitName: Record<string, Record<'long' | 'short', string>> = {
  second: {long: "second", short: "sec"},
  minute: {long: "minute", short: "min"},
  hour: {long: "hour", short: "hr"},
  day: {long: "day", short: "day"},
  week: {long: "week", short: "wk"},
  month: {long: "month", short: "mo"},
  year: {long: "year", short: "yr"},
  millenia: {long: "kyr", short: "kyr"},
  megayear: {long: "Myr", short: "Myr"},
  gigayear: {long: "Gyr", short: "Gyr"},
};


export function niceRate(rate, decimalPlaces = 1) {
  if (rate < 120) {
    return `${rate} x`;
  }
  
  function getString(value: number, unit: keyof typeof unitName, long: boolean = false) {
    const fixed = value.toFixed(decimalPlaces);
    const unitStr = _plural(long ? unitName[unit].long : unitName[unit].short, false);
    return `${fixed} ${unitStr}/s`;
  }
  
  
  const minutes = rate / 60; // seconds to minutes
  if (rounded(minutes,decimalPlaces) <= 180) {
    return getString(minutes, 'minute', false);
  }
  const hours = minutes / 60; // minutes to hours
  if (rounded(hours,decimalPlaces) <= 48) {
    return getString(hours, 'hour', false);
  }
  const days = hours / 24;
  if (rounded(days,decimalPlaces) <= 120) {
    return getString(days, 'day', false);
  }
  const weeks = days / 7;
  if (rounded(weeks,decimalPlaces) <= 6) {
    return getString(weeks, 'week', false);
  }
  const months = days / 30;
  if (rounded(months,decimalPlaces) <= 24) {
    return getString(months, 'month', false);
  }
  const years = days / 365.25;
  if (rounded(years,decimalPlaces) < 10_000) {
    return getString(years, 'year', false);
  }
  const millenia = years / 1000;
  if (rounded(millenia,decimalPlaces) < 1000) {
    return getString(millenia, 'millenia', false);
  }
  const megayear = millenia / 1000;
  if (rounded(megayear,decimalPlaces) < 1000) {
    return getString(megayear, 'megayear', false);
  }
  const gigayear = megayear / 1000;
  return getString(gigayear, 'gigayear', false);
}


import { addToWindow } from "./utils";
addToWindow("niceRate", niceRate);