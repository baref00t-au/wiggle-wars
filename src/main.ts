// Phase 1 has no UI yet — the simulation engine lives in src/sim and is exercised
// entirely by the Vitest suite (`npm test`). Rendering arrives in Phase 2.
const app = document.querySelector<HTMLDivElement>('#app');
if (app) {
  app.innerHTML = `
    <div>
      <h1>Wiggle Wars</h1>
      <p>Engine online — Phase 1 (simulation only).</p>
      <p>Run <code>npm test</code> to verify the deterministic core.</p>
    </div>
  `;
}
