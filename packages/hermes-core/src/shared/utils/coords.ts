export function foundryToMachine(px: number, sceneMax: number): number {
  return Math.round((px / sceneMax) * 1000);
}

export function machineToFoundry(units: number, sceneMax: number): number {
  return Math.round((units / 1000) * sceneMax);
}

export function normalizedToMachine(val: number): number {
  return Math.round(val * 1000);
}
