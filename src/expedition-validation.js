const DIRECTIONS = Object.freeze({
  n: { opposite: "s" },
  e: { opposite: "w" },
  s: { opposite: "n" },
  w: { opposite: "e" },
});

export function validateExpeditionLayout(map) {
  const ids = map.nodes.map((node) => node.id),
    byId = new Map(map.nodes.map((node) => [node.id, node])),
    critical = new Set(map.criticalPath || []),
    errors = [];
  if (ids.length !== byId.size) errors.push("room ids must be unique");
  const start = byId.get(map.startId);
  if (!start) errors.push("missing start");

  for (const node of map.nodes) {
    for (const [direction, linkedId] of Object.entries(node.links)) {
      const linked = byId.get(linkedId);
      if (!linked) {
        errors.push(`${node.id} links to missing room ${linkedId}`);
        continue;
      }
      const opposite = DIRECTIONS[direction]?.opposite;
      if (!opposite || linked.links[opposite] !== node.id)
        errors.push(`${node.id} has a one-way ${direction} link`);
    }
  }

  if (start) {
    const reached = new Set([start.id]),
      queue = [start.id];
    while (queue.length) {
      const node = byId.get(queue.shift());
      for (const linkedId of Object.values(node.links)) {
        if (reached.has(linkedId) || !byId.has(linkedId)) continue;
        reached.add(linkedId);
        queue.push(linkedId);
      }
    }
    if (reached.size !== map.nodes.length) errors.push("map must be connected");
  }

  for (const type of ["boss", "item", "choice", "shop", "elite"]) {
    if (!map.nodes.some((node) => node.type === type))
      errors.push(`missing ${type}`);
  }
  for (const type of ["item", "choice", "shop", "repair"]) {
    for (const node of map.nodes.filter(
      (candidate) => candidate.type === type,
    )) {
      if (Object.keys(node.links).length !== 1)
        errors.push(`${type} must be terminal`);
      if (critical.has(node.id))
        errors.push(`${type} cannot be on critical path`);
    }
  }
  for (const node of map.nodes.filter(
    (candidate) => candidate.type === "elite",
  )) {
    if (critical.has(node.id)) errors.push("elite cannot be on critical path");
  }
  const boss = byId.get(map.bossId);
  if (!boss) errors.push("missing boss");
  else if (boss.type !== "boss")
    errors.push("boss id must reference boss room");
  if (map.criticalPath?.[0] !== map.startId)
    errors.push("critical path must start at the entry room");
  if (map.criticalPath?.at(-1) !== map.bossId)
    errors.push("critical path must end at the boss");
  for (const id of map.criticalPath || []) {
    const type = byId.get(id)?.type;
    if (id !== map.bossId && type !== "combat")
      errors.push(`${type} cannot gate boss`);
  }
  for (let i = 1; i < (map.criticalPath?.length || 0); i++) {
    const previous = byId.get(map.criticalPath[i - 1]);
    if (!Object.values(previous?.links || {}).includes(map.criticalPath[i]))
      errors.push("critical path must be contiguous");
  }

  const black = byId.get(map.blackId);
  if (!black) errors.push("missing black signal");
  else {
    if (black.type !== "black")
      errors.push("black id must reference black signal");
    if (!Object.values(black.links).includes(map.bossId))
      errors.push("black signal must attach directly to boss");
    if (Object.keys(black.links).length !== 1)
      errors.push("black signal must be terminal");
  }
  for (const id of map.secretIds || []) {
    if (byId.get(id)?.type !== "secret")
      errors.push("secret ids must reference secret rooms");
  }
  return errors;
}
