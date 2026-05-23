import Papa from "papaparse";
import * as THREE from "three";

export async function loadCSV(path) {
  const response = await fetch(path);

  if (!response.ok) {
    throw new Error(`Failed to load CSV: ${path}`);
  }

  const text = await response.text();

  return Papa.parse(text, {
    header: true,
    dynamicTyping: true,
    skipEmptyLines: true,
  }).data;
}

export function landmarkRowToVectors(row) {
  const scale = 0.8;

  return Array.from({ length: 21 }, (_, i) => {
    return new THREE.Vector3(
      -row[`x_${i}`] * scale,
      -row[`y_${i}`] * scale,
      row[`z_${i}`] * scale
    );
  });
}