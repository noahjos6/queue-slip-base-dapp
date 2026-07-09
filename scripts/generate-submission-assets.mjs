import { mkdir, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import sharp from "sharp";

const root = resolve(new URL("..", import.meta.url).pathname);
const outDir = join(root, "base-submission");
const W = 1284;
const H = 2778;

const c = {
  bg: "#07131f",
  panel: "#0d2233",
  panel2: "#123249",
  ink: "#e8fff3",
  green: "#97ff6f",
  mint: "#31d696",
  line: "rgba(151,255,111,0.14)",
};

function esc(value) {
  return String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

function wrap(text, maxChars) {
  const words = text.split(" ");
  const lines = [];
  let line = "";
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (next.length > maxChars && line) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function frame(content) {
  return `
  <svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${W}" height="${H}" fill="${c.bg}"/>
    <path d="M0 250H1284M0 500H1284M0 750H1284M0 1000H1284M0 1250H1284M0 1500H1284M0 1750H1284M0 2000H1284M0 2250H1284M0 2500H1284" stroke="${c.line}" stroke-width="3"/>
    ${content}
  </svg>`;
}

function titleBlock(title, subtitle) {
  return `
    <text x="82" y="130" font-family="Courier New, monospace" font-size="30" font-weight="900" letter-spacing="7" fill="${c.green}">QUEUE SLIP</text>
    <text x="80" y="240" font-family="Arial, sans-serif" font-size="84" font-weight="900" fill="${c.ink}">${esc(title)}</text>
    <text x="84" y="314" font-family="Arial, sans-serif" font-size="34" font-weight="800" fill="${c.mint}">${esc(subtitle)}</text>
  `;
}

function bigBoard(x, y, queue, number, note, wallet, date) {
  const noteLines = wrap(note, 36).slice(0, 3);
  return `
    <rect x="${x}" y="${y}" width="1080" height="1280" rx="34" fill="${c.panel}" stroke="${c.line}" stroke-width="6"/>
    <rect x="${x + 40}" y="${y + 40}" width="1000" height="160" rx="24" fill="${c.panel2}"/>
    <text x="${x + 84}" y="${y + 102}" font-family="Courier New, monospace" font-size="24" font-weight="900" letter-spacing="6" fill="${c.green}">NOW SERVING</text>
    <text x="${x + 84}" y="${y + 162}" font-family="Arial, sans-serif" font-size="52" font-weight="900" fill="${c.ink}">${esc(queue)}</text>
    <rect x="${x + 40}" y="${y + 250}" width="1000" height="520" rx="28" fill="rgba(4,15,23,0.95)"/>
    <text x="${x + 168}" y="${y + 602}" font-family="Courier New, monospace" font-size="230" font-weight="900" letter-spacing="20" fill="${c.green}">${esc(number)}</text>
    <rect x="${x + 40}" y="${y + 820}" width="1000" height="170" rx="22" fill="${c.panel2}"/>
    <text x="${x + 82}" y="${y + 878}" font-family="Courier New, monospace" font-size="21" font-weight="900" letter-spacing="5" fill="${c.green}">QUEUE NOTE</text>
    ${noteLines.map((line, i) => `<text x="${x + 82}" y="${y + 930 + i * 34}" font-family="Arial, sans-serif" font-size="30" font-weight="800" fill="${c.ink}">${esc(line)}</text>`).join("")}
    <rect x="${x + 40}" y="${y + 1030}" width="316" height="180" rx="22" fill="rgba(18,50,73,0.96)"/>
    <rect x="${x + 382}" y="${y + 1030}" width="316" height="180" rx="22" fill="rgba(18,50,73,0.96)"/>
    <rect x="${x + 724}" y="${y + 1030}" width="316" height="180" rx="22" fill="rgba(18,50,73,0.96)"/>
    <text x="${x + 76}" y="${y + 1086}" font-family="Courier New, monospace" font-size="20" font-weight="900" fill="${c.green}">TICKET</text>
    <text x="${x + 76}" y="${y + 1144}" font-family="Arial, sans-serif" font-size="38" font-weight="900" fill="${c.ink}">${esc(number)}</text>
    <text x="${x + 418}" y="${y + 1086}" font-family="Courier New, monospace" font-size="20" font-weight="900" fill="${c.green}">WALLET</text>
    <text x="${x + 418}" y="${y + 1144}" font-family="Arial, sans-serif" font-size="34" font-weight="900" fill="${c.ink}">${esc(wallet)}</text>
    <text x="${x + 760}" y="${y + 1086}" font-family="Courier New, monospace" font-size="20" font-weight="900" fill="${c.green}">STAMPED</text>
    <text x="${x + 760}" y="${y + 1144}" font-family="Arial, sans-serif" font-size="34" font-weight="900" fill="${c.ink}">${esc(date)}</text>
  `;
}

function panel(x, y, title, body) {
  return `
    <rect x="${x}" y="${y}" width="520" height="220" rx="24" fill="${c.panel2}" stroke="${c.line}" stroke-width="5"/>
    <text x="${x + 34}" y="${y + 74}" font-family="Courier New, monospace" font-size="20" font-weight="900" letter-spacing="5" fill="${c.green}">${esc(title)}</text>
    ${wrap(body, 30).slice(0, 3).map((line, i) => `<text x="${x + 34}" y="${y + 128 + i * 34}" font-family="Arial, sans-serif" font-size="30" font-weight="850" fill="${c.ink}">${esc(line)}</text>`).join("")}
  `;
}

function screenshot1() {
  return frame(`
    ${titleBlock("Take a number.", "Claim a queue spot for popups, demos, and small drops.")}
    ${bigBoard(102, 420, "Builder Breakfast", "001", "One breakfast plate and coffee.", "0x52...93f7", "May 18")}
    ${panel(102, 1760, "Queue setup", "Choose a queue name and short note before claiming.")}
    ${panel(662, 1760, "Public receipt", "Wallet and queue number stay visible by ticket ID.")}
  `);
}

function screenshot2() {
  return frame(`
    ${titleBlock("Call the next spot.", "Use the display board view after a ticket claim.")}
    ${panel(102, 420, "Queue", "Sticker Drop")}
    ${panel(662, 420, "Action", "Claim on Base")}
    ${bigBoard(102, 760, "Sticker Drop", "014", "Collect one sticker pack at the Base table.", "0x42...af62", "May 18")}
  `);
}

function screenshot3() {
  return frame(`
    ${titleBlock("Load any ticket.", "Look up a past queue claim by ID.")}
    ${bigBoard(102, 420, "Demo Desk", "027", "Quick five-minute product walkthrough slot.", "0x99...9652", "May 18")}
    ${panel(102, 1760, "Lookup", "Reload a claimed ticket by ticket ID.")}
    ${panel(662, 1760, "BaseScan", "Open the transaction after claim confirmation.")}
  `);
}

function iconSvg() {
  return `
  <svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
    <rect width="1024" height="1024" fill="${c.bg}"/>
    <rect x="140" y="164" width="744" height="696" rx="80" fill="${c.panel}" stroke="${c.line}" stroke-width="20"/>
    <rect x="204" y="240" width="616" height="136" rx="30" fill="${c.panel2}"/>
    <rect x="204" y="432" width="616" height="236" rx="30" fill="rgba(4,15,23,0.95)"/>
    <text x="278" y="608" font-family="Courier New, monospace" font-size="170" font-weight="900" letter-spacing="12" fill="${c.green}">042</text>
    <rect x="204" y="720" width="286" height="82" rx="18" fill="${c.panel2}"/>
    <rect x="534" y="720" width="286" height="82" rx="18" fill="${c.panel2}"/>
  </svg>`;
}

function thumbnailSvg() {
  return `
  <svg width="1910" height="1000" viewBox="0 0 1910 1000" xmlns="http://www.w3.org/2000/svg">
    <rect width="1910" height="1000" fill="${c.bg}"/>
    <text x="92" y="154" font-family="Arial, sans-serif" font-size="118" font-weight="900" fill="${c.ink}">Queue Slip</text>
    <text x="100" y="248" font-family="Arial, sans-serif" font-size="42" font-weight="800" fill="${c.mint}">Claim a public queue number on Base.</text>
    ${panel(96, 390, "Use case", "Popups, check-ins, sticker drops, demo desks.")}
    ${panel(96, 662, "Result", "Get a visible queue number and Base transaction.")}
    ${bigBoard(770, 88, "Builder Breakfast", "001", "One breakfast plate and coffee.", "0x52...93f7", "May 18")}
  </svg>`;
}

async function writePng(name, svg, width = W, height = H) {
  const file = join(outDir, name);
  await sharp(Buffer.from(svg)).resize(width, height).png({ compressionLevel: 9 }).toFile(file);
  return file;
}

async function writeJpg(name, svg, width, height) {
  const file = join(outDir, name);
  await sharp(Buffer.from(svg)).resize(width, height).jpeg({ quality: 88, mozjpeg: true }).toFile(file);
  return file;
}

await mkdir(outDir, { recursive: true });

const files = [
  await writeJpg("app-icon.jpg", iconSvg(), 1024, 1024),
  await writeJpg("app-thumbnail.jpg", thumbnailSvg(), 1910, 1000),
  await writePng("screenshot-1.png", screenshot1()),
  await writePng("screenshot-2.png", screenshot2()),
  await writePng("screenshot-3.png", screenshot3()),
];

await writeFile(join(outDir, "asset-manifest.json"), JSON.stringify({ generatedAt: new Date().toISOString(), files }, null, 2), "utf8");
await writeFile(
  join(outDir, "submission-copy.md"),
  [
    "# Queue Slip",
    "",
    "App Name: Queue Slip",
    "Tagline: Claim a queue spot",
    "Description: Claim a public queue number with queue name, note, wallet, and timestamp on Base for popups and small drops.",
    "",
    "Domain: https://queue-slip.vercel.app",
    "",
    "Assets:",
    "- app-icon.jpg",
    "- app-thumbnail.jpg",
    "- screenshot-1.png",
    "- screenshot-2.png",
    "- screenshot-3.png",
    "",
  ].join("\n"),
  "utf8",
);

console.log(`Generated ${files.length} Base submission assets in ${outDir}`);
