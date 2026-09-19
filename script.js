/* ============================================================
   2-Link Parallel Robot — Web Simulator
   Designer: MohammadReza GohariManesh
   ============================================================ */

'use strict';

/* ============ Robot Parameters (millimeters) ============ */
const D  = 48.0;
const L1 = 90.0;
const L2 = 150.0;
const xL = -D / 2, yL = 0.0;
const xR =  D / 2, yR = 0.0;

/* ============ World Bounds ============ */
const WORLD_MIN_X = -260;
const WORLD_MAX_X =  260;
const WORLD_MIN_Y = -180;
const WORLD_MAX_Y =  330;

/* ============ Canvas Variables ============ */
const canvas = document.getElementById('robotCanvas');
const ctx = canvas.getContext('2d');

let SCALE = 1.5;
let ORIGIN_X = 0;
let ORIGIN_Y = 0;
let CSS_W = 0;
let CSS_H = 0;

/* ============ Application State ============ */
let pathSegments = [];   // array of polylines (each is an array of {x,y})
let showWorkspace = true;
let currentX = 0;
let currentY = 150;

/* ============================================================
   Canvas sizing and dynamic scale
   ============================================================ */
function resizeCanvas() {
    const wrap = canvas.parentElement;
    const dpr = window.devicePixelRatio || 1;

    CSS_W = Math.max(300, wrap.clientWidth  - 40);
    CSS_H = Math.max(300, wrap.clientHeight - 40);

    canvas.width  = Math.floor(CSS_W * dpr);
    canvas.height = Math.floor(CSS_H * dpr);
    canvas.style.width  = CSS_W + 'px';
    canvas.style.height = CSS_H + 'px';

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const worldW = WORLD_MAX_X - WORLD_MIN_X;
    const worldH = WORLD_MAX_Y - WORLD_MIN_Y;
    SCALE = Math.min(CSS_W / worldW, CSS_H / worldH);

    ORIGIN_X = CSS_W / 2 - ((WORLD_MIN_X + WORLD_MAX_X) / 2) * SCALE;
    ORIGIN_Y = CSS_H - (20 * SCALE);

    redraw(currentX, currentY);
}

window.addEventListener('resize', resizeCanvas);
window.addEventListener('orientationchange', () => setTimeout(resizeCanvas, 100));

/* ============================================================
   Coordinate conversion
   ============================================================ */
function toPx(x, y) {
    return {
        px: ORIGIN_X + x * SCALE,
        py: ORIGIN_Y - y * SCALE
    };
}

/* ============================================================
   Inverse Kinematics
   ============================================================ */
function ik(x, y) {
    const dL = Math.hypot(x - xL, y - yL);
    if (dL < Math.abs(L1 - L2) || dL > L1 + L2) return [null, null];
    const cosBL = (L1 * L1 + dL * dL - L2 * L2) / (2 * L1 * dL);
    const t1 = Math.atan2(y - yL, x - xL) +
               Math.acos(Math.max(-1, Math.min(1, cosBL)));

    const dR = Math.hypot(x - xR, y - yR);
    if (dR < Math.abs(L1 - L2) || dR > L1 + L2) return [null, null];
    const cosBR = (L1 * L1 + dR * dR - L2 * L2) / (2 * L1 * dR);
    const t2 = Math.atan2(y - yR, x - xR) -
               Math.acos(Math.max(-1, Math.min(1, cosBR)));

    return [t1 * 180 / Math.PI, t2 * 180 / Math.PI];
}

/* ============================================================
   Drawing helpers
   ============================================================ */
function drawGrid() {
    ctx.save();
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;

    for (let x = WORLD_MIN_X; x <= WORLD_MAX_X; x += 50) {
        const p1 = toPx(x, WORLD_MIN_Y);
        const p2 = toPx(x, WORLD_MAX_Y);
        ctx.beginPath(); ctx.moveTo(p1.px, p1.py); ctx.lineTo(p2.px, p2.py); ctx.stroke();
    }
    for (let y = WORLD_MIN_Y; y <= WORLD_MAX_Y; y += 50) {
        const p1 = toPx(WORLD_MIN_X, y);
        const p2 = toPx(WORLD_MAX_X, y);
        ctx.beginPath(); ctx.moveTo(p1.px, p1.py); ctx.lineTo(p2.px, p2.py); ctx.stroke();
    }

    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 2;

    const vTop = toPx(0, WORLD_MAX_Y);
    const vBot = toPx(0, WORLD_MIN_Y);
    ctx.beginPath(); ctx.moveTo(vTop.px, vTop.py); ctx.lineTo(vBot.px, vBot.py); ctx.stroke();

    const hLeft = toPx(WORLD_MIN_X, 0);
    const hRight = toPx(WORLD_MAX_X, 0);
    ctx.beginPath(); ctx.moveTo(hLeft.px, hLeft.py); ctx.lineTo(hRight.px, hRight.py); ctx.stroke();

    ctx.restore();
}

function drawWorkspaceArea() {
    if (!showWorkspace) return;
    ctx.save();

    const baseL = toPx(xL, yL);
    const baseR = toPx(xR, yR);

    ctx.strokeStyle = 'rgba(56, 189, 248, 0.22)';
    ctx.setLineDash([6, 6]);
    ctx.lineWidth = 1.5;

    ctx.beginPath(); ctx.arc(baseL.px, baseL.py, (L1 + L2) * SCALE, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.arc(baseL.px, baseL.py, Math.abs(L1 - L2) * SCALE, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.arc(baseR.px, baseR.py, (L1 + L2) * SCALE, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.arc(baseR.px, baseR.py, Math.abs(L1 - L2) * SCALE, 0, Math.PI * 2); ctx.stroke();

    ctx.restore();
}

function drawPath() {
    if (pathSegments.length === 0) return;

    ctx.save();
    ctx.strokeStyle = '#a855f7';
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    for (const seg of pathSegments) {
        if (seg.length < 2) continue;
        ctx.beginPath();
        const start = toPx(seg[0].x, seg[0].y);
        ctx.moveTo(start.px, start.py);
        for (let i = 1; i < seg.length; i++) {
            const p = toPx(seg[i].x, seg[i].y);
            ctx.lineTo(p.px, p.py);
        }
        ctx.stroke();
    }

    ctx.restore();
}

function drawCircle(px, py, radius, fillColor, strokeColor = '#0f172a', strokeWidth = 2) {
    ctx.beginPath();
    ctx.arc(px, py, radius, 0, Math.PI * 2);
    ctx.fillStyle = fillColor;
    ctx.fill();
    if (strokeColor) {
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = strokeWidth;
        ctx.stroke();
    }
}

function drawLink(p1, p2, color, width = 6) {
    ctx.beginPath();
    ctx.moveTo(p1.px, p1.py);
    ctx.lineTo(p2.px, p2.py);
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.lineCap = 'round';
    ctx.stroke();
}

function drawRobot(x, y) {
    const baseL = toPx(xL, yL);
    const baseR = toPx(xR, yR);

    const [deg1, deg2] = ik(x, y);

    if (deg1 === null || deg2 === null) {
        drawCircle(baseL.px, baseL.py, 9, '#38bdf8');
        drawCircle(baseR.px, baseR.py, 9, '#4ade80');
        return false;
    }

    const r1 = deg1 * Math.PI / 180;
    const r2 = deg2 * Math.PI / 180;

    const mxL = xL + L1 * Math.cos(r1);
    const myL = yL + L1 * Math.sin(r1);
    const mxR = xR + L1 * Math.cos(r2);
    const myR = yR + L1 * Math.sin(r2);

    const elbowL = toPx(mxL, myL);
    const elbowR = toPx(mxR, myR);
    const target = toPx(x, y);

    drawLink(baseL, elbowL, '#38bdf8', 6);
    drawLink(elbowL, target, '#0ea5e9', 6);
    drawLink(baseR, elbowR, '#4ade80', 6);
    drawLink(elbowR, target, '#22c55e', 6);

    drawCircle(baseL.px, baseL.py, 9, '#38bdf8');
    drawCircle(baseR.px, baseR.py, 9, '#4ade80');
    drawCircle(elbowL.px, elbowL.py, 7, '#7dd3fc');
    drawCircle(elbowR.px, elbowR.py, 7, '#86efac');
    drawCircle(target.px, target.py, 8, '#facc15', '#ffffff', 2);

    document.getElementById('angLeft').textContent  = deg1.toFixed(1);
    document.getElementById('angRight').textContent = deg2.toFixed(1);

    return true;
}

function redraw(x = null, y = null) {
    ctx.clearRect(0, 0, CSS_W, CSS_H);

    drawGrid();
    drawWorkspaceArea();
    drawPath();

    if (x === null || y === null) {
        x = currentX;
        y = currentY;
    }

    const ok = drawRobot(x, y);

    const statusEl = document.getElementById('status');
    if (ok) {
        statusEl.textContent = '✅ Reachable';
        statusEl.style.color = '#4ade80';
    } else {
        statusEl.textContent = '❌ Out of reach';
        statusEl.style.color = '#ef4444';
    }
}

/* ============================================================
   Target control
   ============================================================ */
function setTarget(x, y) {
    const [a, b] = ik(x, y);
    const valid = (a !== null && b !== null);

    currentX = x;
    currentY = y;

    document.getElementById('xVal').textContent = x.toFixed(0);
    document.getElementById('yVal').textContent = y.toFixed(0);
    document.getElementById('xSlider').value = x;
    document.getElementById('ySlider').value = y;

    redraw(x, y);
    return valid;
}

/* ============================================================
   CONTOUR TRACING
   ------------------------------------------------------------
   This is the JavaScript equivalent of OpenCV's
   findContours(...) + CHAIN_APPROX_NONE used in the Python
   version. It walks along the outline of each glyph and
   produces a set of polylines that match what the Python
   code draws.
   ============================================================ */

/**
 * Extract the outline (contour) of every glyph from a binary
 * pixel grid using a Moore-neighbor tracing algorithm.
 *
 * @param {Uint8Array} binary  W*H array, 1 = foreground, 0 = background
 * @param {number} W
 * @param {number} H
 * @returns {Array<Array<{x:number, y:number}>>} list of polylines
 */
function findContours(binary, W, H) {
    const visited = new Uint8Array(W * H);
    const contours = [];

    // Moore neighborhood (clockwise starting from east)
    const dx = [1, 1, 0, -1, -1, -1, 0, 1];
    const dy = [0, 1, 1,  1,  0, -1, -1, -1];

    const idx = (x, y) => y * W + x;
    const at  = (x, y) => (x >= 0 && x < W && y >= 0 && y < H) ? binary[idx(x, y)] : 0;

    for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
            if (at(x, y) === 0 || visited[idx(x, y)]) continue;

            // Check if this is a starting boundary point
            // (its western neighbor is background)
            if (at(x - 1, y) === 1) continue;

            // Trace the contour
            const contour = [];
            let cx = x, cy = y;
            let dir = 7; // Start looking from north-west
            const startX = x, startY = y;
            let safety = W * H * 4;

            do {
                contour.push({ x: cx, y: cy });
                visited[idx(cx, cy)] = 1;

                // Search clockwise for the next boundary pixel
                let found = false;
                for (let k = 0; k < 8; k++) {
                    const nd = (dir + 6 + k) % 8; // start from backtrack direction
                    const nx = cx + dx[nd];
                    const ny = cy + dy[nd];
                    if (at(nx, ny) === 1) {
                        cx = nx; cy = ny;
                        dir = nd;
                        found = true;
                        break;
                    }
                }
                if (!found) break;

            } while (!(cx === startX && cy === startY) && --safety > 0);

            if (contour.length > 4) {
                contours.push(contour);
            }
        }
    }

    return contours;
}

/* ============================================================
   Convert text to path segments (mirrors the Python version)
   ============================================================ */
function textToPath() {
    const text = document.getElementById('textInput').value.trim();
    if (!text) {
        alert('Please enter some text.');
        return;
    }

    document.getElementById('status').textContent = '⏳ Processing text...';

    setTimeout(() => {
        // ---------- 1. Render text on an offscreen canvas ----------
        const offW = 600;
        const offH = 200;
        const off = document.createElement('canvas');
        off.width = offW;
        off.height = offH;
        const octx = off.getContext('2d');

        // Black background, white text
        octx.fillStyle = 'black';
        octx.fillRect(0, 0, offW, offH);
        octx.fillStyle = 'white';
        octx.font = 'bold 80px "Segoe UI", Tahoma, Arial, sans-serif';
        octx.textAlign = 'center';
        octx.textBaseline = 'middle';
        octx.fillText(text, offW / 2, offH / 2);

        // ---------- 2. Build a binary grid ----------
        const imgData = octx.getImageData(0, 0, offW, offH).data;
        const binary = new Uint8Array(offW * offH);
        for (let i = 0, j = 0; i < imgData.length; i += 4, j++) {
            binary[j] = imgData[i] > 128 ? 1 : 0;
        }

        // ---------- 3. Trace contours ----------
        const contours = findContours(binary, offW, offH);

        if (contours.length === 0) {
            document.getElementById('status').textContent = '❌ No text detected';
            return;
        }

        // ---------- 4. Bounding box of all contour points ----------
        let minX = Infinity, maxX = -Infinity;
        let minY = Infinity, maxY = -Infinity;
        for (const c of contours) {
            for (const p of c) {
                if (p.x < minX) minX = p.x;
                if (p.x > maxX) maxX = p.x;
                if (p.y < minY) minY = p.y;
                if (p.y > maxY) maxY = p.y;
            }
        }

        const cxBox = (minX + maxX) / 2;
        const cyBox = (minY + maxY) / 2;
        const wBox  = (maxX - minX) || 1;
        const hBox  = (maxY - minY) || 1;

        // Scale so that the drawing fits inside the workspace.
        // Keep the same aspect-ratio philosophy as the Python code.
        const maxDrawW = 200;   // mm
        const maxDrawH = 110;   // mm
        const scale = Math.min(maxDrawW / wBox, maxDrawH / hBox) * 0.9;
        const offsetY = 150;

        // ---------- 5. Convert every contour to robot coordinates ----------
        pathSegments = [];
        let totalPoints = 0;

        for (const contour of contours) {
            const seg = [];
            let lastPt = null;

            for (const p of contour) {
                // Skip points that are too close (equivalent to CHAIN_APPROX_NONE
                // but with a mild downsampling to keep the path smooth)
                if (lastPt && Math.hypot(p.x - lastPt.x, p.y - lastPt.y) < 2) continue;
                lastPt = p;

                const rx = (p.x - cxBox) * scale;
                const ry = offsetY - (p.y - cyBox) * scale;

                const [a, b] = ik(rx, ry);
                if (a !== null && b !== null) {
                    seg.push({ x: rx, y: ry });
                    totalPoints++;
                }
            }

            if (seg.length >= 2) pathSegments.push(seg);
        }

        if (pathSegments.length === 0) {
            document.getElementById('status').textContent = '❌ Text outside workspace';
            return;
        }

        // ---------- 6. Move to the first point of the last segment ----------
        const lastSeg = pathSegments[pathSegments.length - 1];
        const lastPt = lastSeg[lastSeg.length - 1];
        setTarget(lastPt.x, lastPt.y);

        document.getElementById('status').textContent =
            `✅ ${pathSegments.length} contours, ${totalPoints} points`;

    }, 30);
}

/* ============================================================
   Event bindings
   ============================================================ */
function bindEvents() {
    document.getElementById('xSlider').addEventListener('input', (e) => {
        setTarget(parseFloat(e.target.value), currentY);
    });

    document.getElementById('ySlider').addEventListener('input', (e) => {
        setTarget(currentX, parseFloat(e.target.value));
    });

    document.getElementById('drawTextBtn').addEventListener('click', textToPath);

    document.getElementById('clearBtn').addEventListener('click', () => {
        pathSegments = [];
        redraw(currentX, currentY);
        document.getElementById('status').textContent = 'Ready';
    });

    document.getElementById('wsBtn').addEventListener('click', () => {
        showWorkspace = !showWorkspace;
        redraw(currentX, currentY);
    });

    document.getElementById('textInput').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') textToPath();
    });
}

/* ============================================================
   Initialization
   ============================================================ */
function init() {
    bindEvents();
    resizeCanvas();
    setTarget(0, 150);
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}