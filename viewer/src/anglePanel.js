export function createAngleMap(angleRows) {
  return new Map(angleRows.map(row => [row.image, row]));
}

export function updateAnglePanel(angleRow) {
  const panel = document.getElementById("angle-panel");

  if (!angleRow) {
    panel.innerHTML = "<p>No angle data for this frame.</p>";
    return;
  }

  panel.innerHTML = Object.entries(angleRow)
    .filter(([key]) => key !== "image")
    .map(([key, value]) => {
      const angle = Number(value);
      const flexion = 180 - angle;

      return `
        <div class="angle-row">
          <span>${key}</span>
          <span>${angle.toFixed(1)}°</span>
          <span class="muted">flexion ≈ ${flexion.toFixed(1)}°</span>
        </div>
      `;
    })
    .join("");
}