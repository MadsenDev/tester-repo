import { moduleById, MODULES } from "./module-catalog.js";
import { renderModuleChoice } from "./module-choice-ui.js";
const choices = document.querySelector("#choices");
const byName = new Map(MODULES.map((m) => [m.name, m]));
function enhance() {
  if (!choices) return;
  for (const button of choices.querySelectorAll("button.choice")) {
    if (button.dataset.moduleUi === "1") continue;
    const name = button.querySelector("b")?.textContent?.trim(),
      module = byName.get(name) || moduleById(button.dataset.moduleId);
    if (!module) continue;
    button.dataset.moduleUi = "1";
    renderModuleChoice(
      button,
      module,
      globalThis.__orbitalSynergyPlayer || null,
    );
  }
}
if (choices) {
  new MutationObserver(enhance).observe(choices, {
    childList: true,
    subtree: true,
  });
  enhance();
}
