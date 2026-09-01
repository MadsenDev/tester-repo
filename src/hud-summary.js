export function compactArsenalLabel(player, synergies = [], weapon = "") {
  const items = player?.items,
    moduleCount = items instanceof Set
      ? items.size
      : Array.isArray(items)
        ? items.length
        : 0;
  const apex = synergies.filter((synergy) => synergy.apex);
  const suffix = apex.length === 1
    ? apex[0].name
    : apex.length > 1
      ? `${apex.length} APEX SYNERGIES`
      : weapon;
  return [player?.shipName || "SHIP", `${moduleCount} MODULES`, suffix]
    .filter(Boolean)
    .join(" · ");
}
