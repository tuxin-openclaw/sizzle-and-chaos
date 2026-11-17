import * as THREE from "three";
import type { Theme } from "../game/types";

const srgb = THREE.SRGBColorSpace;

function baseCanvas(width: number, height: number) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("2D canvas is unavailable");
  return { canvas, ctx };
}

function finish(canvas: HTMLCanvasElement, repeat?: [number, number]) {
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = srgb;
  texture.anisotropy = 8;
  if (repeat) {
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(repeat[0], repeat[1]);
  }
  texture.needsUpdate = true;
  return texture;
}

function seededNoise(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807 + 19) % 2147483647;
    return s / 2147483647;
  };
}

export function makeFloorTexture(theme: Theme, repeat: [number, number]) {
  const size = 512;
  const { canvas, ctx } = baseCanvas(size, size);
  const half = size / 2;
  const grout = 10;
  const rand = seededNoise(theme.night ? 44 : 17);
  const cells = [
    { x: 0, y: 0, color: theme.floorA },
    { x: half, y: 0, color: theme.floorB },
    { x: 0, y: half, color: theme.floorB },
    { x: half, y: half, color: theme.floorA },
  ];
  ctx.fillStyle = theme.grout;
  ctx.fillRect(0, 0, size, size);
  for (const cell of cells) {
    ctx.fillStyle = cell.color;
    ctx.beginPath();
    ctx.roundRect(cell.x + grout, cell.y + grout, half - grout * 2, half - grout * 2, 10);
    ctx.fill();
    // gentle speckles and glaze marks
    for (let i = 0; i < 26; i++) {
      const x = cell.x + 18 + rand() * (half - 36);
      const y = cell.y + 18 + rand() * (half - 36);
      const r = 1 + rand() * 2.8;
      ctx.fillStyle = rand() > 0.55 ? "rgba(255,255,255,.12)" : "rgba(72,45,28,.07)";
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.strokeStyle = "rgba(255,255,255,.18)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(cell.x + 22, cell.y + half - 20);
    ctx.lineTo(cell.x + half - 22, cell.y + half - 20);
    ctx.stroke();
  }
  // faint dirt at grout crossings, keeps the floor from looking sterile
  for (let i = 0; i < 9; i++) {
    ctx.fillStyle = "rgba(65,40,25,.06)";
    ctx.beginPath();
    ctx.arc(rand() * size, rand() * size, 12 + rand() * 28, 0, Math.PI * 2);
    ctx.fill();
  }
  return finish(canvas, repeat);
}

export function makeRugTexture(theme: Theme) {
  const { canvas, ctx } = baseCanvas(512, 768);
  ctx.fillStyle = theme.rugB;
  ctx.fillRect(0, 0, 512, 768);
  ctx.strokeStyle = theme.rugA;
  ctx.lineWidth = 30;
  ctx.strokeRect(22, 22, 468, 724);
  ctx.lineWidth = 8;
  ctx.strokeRect(54, 54, 404, 660);
  const rows = 8;
  for (let i = 0; i < rows; i++) {
    const y = 100 + i * 76;
    ctx.fillStyle = i % 2 === 0 ? theme.rugA : theme.rugB;
    ctx.beginPath();
    ctx.roundRect(76, y, 360, 26, 13);
    ctx.fill();
    ctx.fillStyle = i % 2 === 0 ? theme.rugB : theme.rugA;
    for (let j = 0; j < 7; j++) {
      ctx.beginPath();
      ctx.arc(100 + j * 52, y + 13, 7, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.globalAlpha = 0.16;
  for (let i = 0; i < 120; i++) {
    ctx.fillStyle = i % 2 ? "#ffffff" : "#3b2a23";
    ctx.fillRect(Math.random() * 512, Math.random() * 768, 3, 2);
  }
  ctx.globalAlpha = 1;
  return finish(canvas);
}

export function makeSkyTexture(theme: Theme) {
  const { canvas, ctx } = baseCanvas(1024, 512);
  const gradient = ctx.createLinearGradient(0, 0, 0, 512);
  gradient.addColorStop(0, theme.skyTop);
  gradient.addColorStop(1, theme.skyBottom);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 1024, 512);

  if (theme.night) {
    for (let i = 0; i < 80; i++) {
      const x = Math.random() * 1024;
      const y = Math.random() * 340;
      const r = Math.random() * 2.2 + 0.4;
      ctx.fillStyle = `rgba(255,243,200,${0.35 + Math.random() * 0.6})`;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = "#FFF3CE";
    ctx.beginPath();
    ctx.arc(790, 125, 46, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(255,243,206,.13)";
    ctx.beginPath();
    ctx.arc(790, 125, 78, 0, Math.PI * 2);
    ctx.fill();
  } else {
    const sun = ctx.createLinearGradient(0, 0, 0, 512);
    sun.addColorStop(0, "rgba(255,255,255,.0)");
    sun.addColorStop(1, "rgba(255,255,255,.0)");
    ctx.fillStyle = sun;
    ctx.fillRect(0, 0, 1024, 512);
    ctx.fillStyle = "rgba(255,246,206,.55)";
    ctx.beginPath();
    ctx.arc(740, 130, 58, 0, Math.PI * 2);
    ctx.fill();
    drawCloud(ctx, 190, 150, 1.2);
    drawCloud(ctx, 540, 90, 0.8);
    drawCloud(ctx, 850, 235, 0.65);
  }
  // distant rooftops
  ctx.fillStyle = theme.night ? "rgba(8,18,30,.85)" : "rgba(104,132,131,.28)";
  let x = -20;
  const rand = seededNoise(33);
  while (x < 1044) {
    const w = 60 + rand() * 120;
    const h = 40 + rand() * 90;
    ctx.fillRect(x, 512 - h, w, h);
    x += w + 8;
  }
  ctx.fillStyle = theme.night ? "rgba(255,201,106,.55)" : "rgba(255,249,222,.45)";
  for (let i = 0; i < 30; i++) {
    ctx.fillRect(40 + Math.random() * 960, 412 + Math.random() * 40, 5, 7);
  }
  return finish(canvas);
}

function drawCloud(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  scale: number,
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.fillStyle = "rgba(255,248,233,.55)";
  for (const [dx, dy, r] of [
    [0, 0, 40],
    [38, -16, 46],
    [84, 0, 34],
    [38, 16, 44],
  ]) {
    ctx.beginPath();
    ctx.arc(dx, dy, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

export function makeChalkboardTexture() {
  const { canvas, ctx } = baseCanvas(768, 480);
  ctx.fillStyle = "#273D37";
  ctx.fillRect(0, 0, 768, 480);
  ctx.strokeStyle = "rgba(255,255,255,.08)";
  ctx.lineWidth = 2;
  for (let i = 0; i < 26; i++) {
    ctx.beginPath();
    ctx.moveTo(Math.random() * 768, 0);
    ctx.lineTo(Math.random() * 768, 480);
    ctx.stroke();
  }
  ctx.fillStyle = "#F8EACD";
  ctx.font = "700 54px 'Fredoka', 'PingFang SC', sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("TODAY'S MENU", 384, 78);
  ctx.strokeStyle = "rgba(248,234,205,.65)";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(120, 104);
  ctx.bezierCurveTo(260, 94, 500, 114, 648, 102);
  ctx.stroke();
  const items: Array<[string, string, string]> = [
    ["经典汉堡", "BURGER", "45"],
    ["田园沙拉", "SALAD", "30"],
    ["豪华汉堡", "DELUXE", "65"],
  ];
  ctx.textAlign = "left";
  for (let i = 0; i < items.length; i++) {
    const [cn, en, price] = items[i];
    const y = 175 + i * 88;
    ctx.fillStyle = "#F8EACD";
    ctx.font = "600 32px 'Fredoka', 'PingFang SC', sans-serif";
    ctx.fillText(cn, 116, y);
    ctx.fillStyle = "rgba(248,234,205,.52)";
    ctx.font = "500 18px 'Fredoka', sans-serif";
    ctx.fillText(en, 120, y + 27);
    ctx.fillStyle = "#F4C95B";
    ctx.font = "700 26px 'Fredoka', sans-serif";
    ctx.textAlign = "right";
    ctx.fillText(`$${price}`, 650, y);
    ctx.textAlign = "left";
    ctx.strokeStyle = "rgba(248,234,205,.24)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(116, y + 44);
    ctx.lineTo(650, y + 44);
    ctx.stroke();
  }
  ctx.fillStyle = "#F4C95B";
  ctx.font = "600 22px 'Fredoka', sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("★  fresh & fast  ★", 384, 440);
  return finish(canvas);
}

export function makeServeSignTexture() {
  const { canvas, ctx } = baseCanvas(640, 128);
  ctx.clearRect(0, 0, 640, 128);
  ctx.fillStyle = "#A83A2C";
  ctx.font = "700 68px 'Fredoka', 'PingFang SC', sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("ORDER UP!", 320, 58);
  ctx.strokeStyle = "#A83A2C";
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(150, 102);
  ctx.bezierCurveTo(270, 94, 390, 110, 490, 100);
  ctx.stroke();
  const texture = finish(canvas);
  texture.premultiplyAlpha = true;
  return texture;
}

export function makeClockTexture() {
  const { canvas, ctx } = baseCanvas(256, 256);
  ctx.clearRect(0, 0, 256, 256);
  ctx.fillStyle = "#FFF7E7";
  ctx.beginPath();
  ctx.arc(128, 128, 120, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#3B2A23";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(128, 128, 116, 0, Math.PI * 2);
  ctx.stroke();
  for (let i = 0; i < 12; i++) {
    const angle = (i / 12) * Math.PI * 2 - Math.PI / 2;
    const r1 = i % 3 === 0 ? 86 : 96;
    ctx.strokeStyle = "#3B2A23";
    ctx.lineWidth = i % 3 === 0 ? 6 : 3;
    ctx.beginPath();
    ctx.moveTo(128 + Math.cos(angle) * r1, 128 + Math.sin(angle) * r1);
    ctx.lineTo(128 + Math.cos(angle) * 106, 128 + Math.sin(angle) * 106);
    ctx.stroke();
  }
  ctx.strokeStyle = "#3B2A23";
  ctx.lineCap = "round";
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.moveTo(128, 128);
  ctx.lineTo(128, 64);
  ctx.stroke();
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(128, 128);
  ctx.lineTo(178, 162);
  ctx.stroke();
  ctx.fillStyle = "#D95743";
  ctx.beginPath();
  ctx.arc(128, 128, 9, 0, Math.PI * 2);
  ctx.fill();
  return finish(canvas);
}

export function makePosterTexture(kind: "salad" | "burger") {
  const { canvas, ctx } = baseCanvas(384, 512);
  const bg = kind === "salad" ? "#E7F0CF" : "#F7E3BD";
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 384, 512);
  ctx.fillStyle = kind === "salad" ? "#6FA845" : "#D89445";
  ctx.beginPath();
  ctx.arc(192, 220, 138, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#3B2A23";
  ctx.lineWidth = 10;
  ctx.stroke();
  ctx.fillStyle = "#FFF8E8";
  ctx.font = "700 64px 'Fredoka', sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(kind === "salad" ? "SALAD" : "BURGER", 192, 430);
  ctx.font = "500 24px 'Fredoka', sans-serif";
  ctx.fillStyle = "#3B2A23";
  ctx.fillText(kind === "salad" ? "crispy & green" : "hot & juicy", 192, 468);
  // simple food doodle
  if (kind === "burger") {
    ctx.fillStyle = "#E8AE68";
    ctx.beginPath();
    ctx.ellipse(192, 190, 76, 46, 0, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = "#8B5232";
    ctx.fillRect(126, 210, 132, 24);
    ctx.fillStyle = "#7AB94D";
    ctx.beginPath();
    ctx.ellipse(192, 240, 76, 18, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#E8AE68";
    ctx.beginPath();
    ctx.ellipse(192, 268, 78, 24, 0, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.fillStyle = "#7AB94D";
    ctx.beginPath();
    ctx.arc(192, 245, 66, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#E4543E";
    ctx.beginPath();
    ctx.arc(160, 220, 30, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(225, 236, 24, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#4E7E31";
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.arc(192, 245, 48, 0.2, 2.4);
    ctx.stroke();
  }
  ctx.strokeStyle = "rgba(59,42,35,.25)";
  ctx.lineWidth = 12;
  ctx.strokeRect(14, 14, 356, 484);
  return finish(canvas);
}

export function makeTileTexture(theme: Theme) {
  const { canvas, ctx } = baseCanvas(512, 512);
  ctx.fillStyle = "#C7B495";
  ctx.fillRect(0, 0, 512, 512);
  const cols = 4;
  const rows = 6;
  const w = 512 / cols;
  const h = 512 / rows;
  const rand = seededNoise(theme.night ? 91 : 29);
  for (let y = 0; y < rows; y++) {
    const offset = y % 2 === 0 ? 0 : w / 2;
    for (let x = -1; x <= cols; x++) {
      const px = x * w + offset + 4;
      const py = y * h + 4;
      ctx.fillStyle = theme.night ? "#D8C7A7" : "#FFF8E8";
      ctx.beginPath();
      ctx.roundRect(px, py, w - 8, h - 8, 8);
      ctx.fill();
      for (let i = 0; i < 5; i++) {
        ctx.fillStyle = rand() > 0.5 ? "rgba(255,255,255,.24)" : "rgba(110,80,51,.055)";
        ctx.beginPath();
        ctx.arc(px + 10 + rand() * (w - 20), py + 8 + rand() * (h - 16), 2 + rand() * 4, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
  return finish(canvas, [4, 1]);
}

export function makePlayerBadgeTexture(color: string, label: string) {
  const { canvas, ctx } = baseCanvas(160, 160);
  ctx.clearRect(0, 0, 160, 160);
  ctx.fillStyle = "rgba(59,42,35,.25)";
  ctx.beginPath();
  ctx.arc(80, 86, 66, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(80, 76, 64, 0, Math.PI * 2);
  ctx.fill();
  ctx.lineWidth = 9;
  ctx.strokeStyle = "#3B2A23";
  ctx.stroke();
  ctx.fillStyle = "#FFF8E8";
  ctx.font = "700 62px 'Fredoka', sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(label, 80, 78);
  return finish(canvas);
}

export function makeFlameTexture() {
  const { canvas, ctx } = baseCanvas(192, 256);
  ctx.clearRect(0, 0, 192, 256);
  const gradient = ctx.createRadialGradient(96, 188, 6, 96, 160, 120);
  gradient.addColorStop(0, "rgba(255,253,200,1)");
  gradient.addColorStop(0.28, "rgba(255,214,86,0.95)");
  gradient.addColorStop(0.62, "rgba(255,112,37,0.8)");
  gradient.addColorStop(1, "rgba(232,58,27,0)");
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.moveTo(96, 240);
  ctx.bezierCurveTo(30, 206, 44, 138, 82, 92);
  ctx.bezierCurveTo(80, 132, 114, 118, 108, 76);
  ctx.bezierCurveTo(166, 122, 174, 198, 132, 232);
  ctx.bezierCurveTo(122, 242, 108, 246, 96, 240);
  ctx.fill();
  ctx.globalCompositeOperation = "lighter";
  const inner = ctx.createRadialGradient(96, 196, 2, 96, 178, 58);
  inner.addColorStop(0, "rgba(255,255,224,0.95)");
  inner.addColorStop(1, "rgba(255,196,50,0)");
  ctx.fillStyle = inner;
  ctx.beginPath();
  ctx.ellipse(96, 192, 34, 54, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalCompositeOperation = "source-over";
  return finish(canvas);
}
