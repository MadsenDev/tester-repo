export function createEventState() {
  return { next: 42, current: null, banner: null };
}
export const EVENTS = [
  {
    id: "overload",
    name: "SYSTEM OVERLOAD",
    desc: "Fire rate doubled. Hostiles accelerate.",
    duration: 14,
  },
  {
    id: "harvest",
    name: "SIGNAL HARVEST",
    desc: "XP attraction massively increased.",
    duration: 16,
  },
  {
    id: "hunt",
    name: "ELITE HUNT",
    desc: "Elites flood the sector. Score bonus active.",
    duration: 18,
  },
  {
    id: "swarm-tide",
    name: "SWARM TIDE",
    desc: "Hostile density surges. Salvage yield amplified.",
    duration: 16,
  },
  {
    id: "glass-space",
    name: "GLASS SPACE",
    desc: "Hull damage becomes severe. Score transmission doubled.",
    duration: 14,
  },
  {
    id: "temporal-echo",
    name: "TEMPORAL ECHO",
    desc: "Weapons and hostiles fall into asymmetric slow time.",
    duration: 13,
  },
];
export function updateEvents(state, dt, time) {
  if (state.banner) {
    state.banner.life -= dt;
    if (state.banner.life <= 0) state.banner = null;
  }
  if (state.current) {
    state.current.left -= dt;
    if (state.current.left <= 0) {
      state.banner = {
        title: "EVENT COMPLETE",
        text: state.current.name,
        life: 2.4,
      };
      state.current = null;
      state.next = time + 38 + Math.random() * 22;
    }
  } else if (time >= state.next && time < 560) {
    const e = EVENTS[Math.floor(Math.random() * EVENTS.length)];
    state.current = { ...e, left: e.duration };
    state.banner = { title: e.name, text: e.desc, life: 3.2 };
  }
}
export function eventModifiers(state) {
  const id = state.current?.id;
  return {
    fire: id === "overload" ? 0.5 : id === "temporal-echo" ? 0.68 : 1,
    enemySpeed: id === "overload" ? 1.22 : id === "temporal-echo" ? 0.7 : 1,
    magnet: id === "harvest" ? 2.8 : 1,
    elite: id === "hunt" ? 0.38 : 0,
    score:
      id === "glass-space"
        ? 2
        : id === "hunt"
          ? 1.5
          : id === "temporal-echo"
            ? 1.35
            : id === "swarm-tide"
              ? 1.25
              : 1,
    spawn: id === "swarm-tide" ? 1.65 : 1,
    xp: id === "swarm-tide" ? 1.55 : 1,
    damageTaken: id === "glass-space" ? 1.75 : 1,
  };
}
export function drawEventBanner(ctx, state, W) {
  if (!state.banner) return;
  const b = state.banner,
    a = Math.min(1, b.life * 2);
  ctx.save();
  ctx.globalAlpha = a;
  ctx.textAlign = "center";
  ctx.fillStyle = "rgba(4,12,20,.82)";
  ctx.fillRect(W / 2 - 180, 92, 360, 68);
  ctx.strokeStyle = "#7fe7ff";
  ctx.strokeRect(W / 2 - 180, 92, 360, 68);
  ctx.fillStyle = "#7fe7ff";
  ctx.font = "800 13px system-ui";
  ctx.fillText(b.title, W / 2, 116);
  ctx.fillStyle = "#d9e6ee";
  ctx.font = "600 12px system-ui";
  ctx.fillText(b.text, W / 2, 140);
  ctx.restore();
}
