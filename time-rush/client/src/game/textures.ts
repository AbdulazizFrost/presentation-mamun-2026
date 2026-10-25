import * as THREE from 'three';

function canvasTexture(size: number, draw: (ctx: CanvasRenderingContext2D, size: number) => void): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('2D canvas is not available');
  draw(ctx, size);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

/** Metal floor tiles with thin seams. */
export function floorTileTexture(): THREE.CanvasTexture {
  const texture = canvasTexture(256, (ctx, s) => {
    ctx.fillStyle = '#5b6274';
    ctx.fillRect(0, 0, s, s);
    ctx.fillStyle = '#4e5567';
    ctx.fillRect(6, 6, s / 2 - 12, s / 2 - 12);
    ctx.fillRect(s / 2 + 6, s / 2 + 6, s / 2 - 12, s / 2 - 12);
    ctx.strokeStyle = '#2b303c';
    ctx.lineWidth = 4;
    ctx.strokeRect(2, 2, s - 4, s - 4);
    ctx.beginPath();
    ctx.moveTo(s / 2, 0);
    ctx.lineTo(s / 2, s);
    ctx.moveTo(0, s / 2);
    ctx.lineTo(s, s / 2);
    ctx.stroke();
  });
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

/** Bright grid for the glowing team lane (white lines, tinted by the material colour). */
export function laneGridTexture(): THREE.CanvasTexture {
  const texture = canvasTexture(256, (ctx, s) => {
    ctx.fillStyle = '#7a7a7a';
    ctx.fillRect(0, 0, s, s);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 5;
    ctx.strokeRect(0, 0, s, s);
    ctx.globalAlpha = 0.35;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(s / 2, 0);
    ctx.lineTo(s / 2, s);
    ctx.moveTo(0, s / 2);
    ctx.lineTo(s, s / 2);
    ctx.stroke();
  });
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

/** Soft round shadow under the runner. */
export function blobShadowTexture(): THREE.CanvasTexture {
  return canvasTexture(128, (ctx, s) => {
    const gradient = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    gradient.addColorStop(0, 'rgba(0,0,0,0.65)');
    gradient.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, s, s);
  });
}

/** Letter badge above a door: dark plate, coloured border, big white letter. */
export function doorBadgeTexture(letter: string, color: string): THREE.CanvasTexture {
  return canvasTexture(256, (ctx, s) => {
    const r = 46;
    ctx.clearRect(0, 0, s, s);
    ctx.beginPath();
    ctx.moveTo(r + 10, 10);
    ctx.arcTo(s - 10, 10, s - 10, s - 10, r);
    ctx.arcTo(s - 10, s - 10, 10, s - 10, r);
    ctx.arcTo(10, s - 10, 10, 10, r);
    ctx.arcTo(10, 10, s - 10, 10, r);
    ctx.closePath();
    ctx.fillStyle = '#1b2232';
    ctx.fill();
    ctx.lineWidth = 12;
    ctx.strokeStyle = color;
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'italic 900 170px "Exo 2", "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(letter, s / 2, s / 2 + 8);
  });
}
