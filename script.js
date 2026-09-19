// ========== پارامترهای ربات ==========
const d = 48.0;
const L1 = 90.0;
const L2 = 150.0;
const xL = -d / 2, yL = 0.0;
const xR =  d / 2, yR = 0.0;

// ========== تنظیمات بوم ==========
const canvas = document.getElementById('robotCanvas');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
    const wrap = canvas.parentElement;
    canvas.width  = wrap.clientWidth  - 40;
    canvas.height = wrap.clientHeight - 40;
    redraw();
}
window.addEventListener('resize', resizeCanvas);

// تبدیل مختصات ربات → پیکسل بوم
function toPx(x, y) {
    const scale = 1.6;
    return {
        px: canvas.width  / 2 + x * scale,
        py: canvas.height - 120 - y * scale   // y به سمت بالا
    };
}

// ========== سینماتیک معکوس ==========
function ik(x, y) {
    const dL = Math.hypot(x - xL, y - yL);
    if (dL < Math.abs(L1 - L2) || dL > L1 + L2) return [null, null];
    const cosBL = (L1*L1 + dL*dL - L2*L2) / (2*L1*dL);
    const t1 = Math.atan2(y - yL, x - xL) + Math.acos(Math.max(-1, Math.min(1, cosBL)));

    const dR = Math.hypot(x - xR, y - yR);
    if (dR < Math.abs(L1 - L2) || dR > L1 + L2) return [null, null];
    const cosBR = (L1*L1 + dR*dR - L2*L2) / (2*L1*dR);
    const t2 = Math.atan2(y - yR, x - xR) - Math.acos(Math.max(-1, Math.min(1, cosBR)));

    return [t1 * 180 / Math.PI, t2 * 180 / Math.PI];
}

// ========== مسیر ترسیم‌شده ==========
let pathPoints = [];   // آرایه‌ای از {x, y}
let showWorkspace = true;

// ========== رسم ==========
function drawGrid() {
    const { px: ox, py: oy } = toPx(0, 0);
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    const step = 50 * 1.6;
    for (let i = -10; i <= 10; i++) {
        const x = ox + i * step;
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
        const y = oy - i * step;
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
    }
    // محورها
    ctx.strokeStyle = '#334155'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, oy); ctx.lineTo(canvas.width, oy); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(ox, 0); ctx.lineTo(ox, canvas.height); ctx.stroke();
}

function drawWorkspaceArea() {
    if (!showWorkspace) return;
    ctx.save();
    // رسم فضای کاری هر بازو با ترکیب دو دایره (تقریب)
    const scale = 1.6;
    const { px: lx, py: ly } = toPx(xL, yL);
    const { px: rx, py: ry } = toPx(xR, yR);

    ctx.strokeStyle = 'rgba(56,189,248,0.25)';
    ctx.setLineDash([6, 6]);
    ctx.lineWidth = 1.5;

    // حلقه بیرونی و داخلی بازوی چپ
    ctx.beginPath(); ctx.arc(lx, ly, (L1+L2)*scale, 0, Math.PI*2); ctx.stroke();
    ctx.beginPath(); ctx.arc(lx, ly, Math.abs(L1-L2)*scale, 0, Math.PI*2); ctx.stroke();
    // راست
    ctx.beginPath(); ctx.arc(rx, ry, (L1+L2)*scale, 0, Math.PI*2); ctx.stroke();
    ctx.beginPath(); ctx.arc(rx, ry, Math.abs(L1-L2)*scale, 0, Math.PI*2); ctx.stroke();

    ctx.restore();
}

function drawBase(px, py, color) {
    ctx.beginPath();
    ctx.arc(px, py, 9, 0, Math.PI*2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = '#0f172a'; ctx.lineWidth = 2; ctx.stroke();
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

function redraw(x = null, y = null) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawGrid();
    drawWorkspaceArea();

    // مسیر
    if (pathPoints.length > 1) {
        ctx.beginPath();
        const start = toPx(pathPoints[0].x, pathPoints[0].y);
        ctx.moveTo(start.px, start.py);
        for (const p of pathPoints.slice(1)) {
            const q = toPx(p.x, p.y);
            ctx.lineTo(q.px, q.py);
        }
        ctx.strokeStyle = '#a855f7';
        ctx.lineWidth = 2.5;
        ctx.stroke();
    }

    // بازوها
    const { px: lx, py: ly } = toPx(xL, yL);
    const { px: rx, py: ry } = toPx(xR, yR);

    if (x !== null && y !== null) {
        const [deg1, deg2] = ik(x, y);
        if (deg1 !== null) {
            const r1 = deg1 * Math.PI / 180;
            const r2 = deg2 * Math.PI / 180;
            const mxL = xL + L1 * Math.cos(r1);
            const myL = yL + L1 * Math.sin(r1);
            const mxR = xR + L1 * Math.cos(r2);
            const myR = yR + L1 * Math.sin(r2);

            const baseL = { px: lx, py: ly };
            const baseR = { px: rx, py: ry };
            const elbowL = toPx(mxL, myL);
            const elbowR = toPx(mxR, myR);
            const target = toPx(x, y);

            // بازوی چپ (آبی)
            drawLink(baseL, elbowL, '#38bdf8');
            drawLink(elbowL, target, '#0ea5e9');
            // بازوی راست (سبز)
            drawLink(baseR, elbowR, '#4ade80');
            drawLink(elbowR, target, '#22c55e');

            // مفصل‌ها
            drawBase(baseL.px, baseL.py, '#38bdf8');
            drawBase(baseR.px, baseR.py, '#4ade80');
            drawBase(elbowL.px, elbowL.py, '#7dd3fc');
            drawBase(elbowR.px, elbowR.py, '#86efac');

            // هدف
            ctx.beginPath();
            ctx.arc(target.px, target.py, 7, 0, Math.PI*2);
            ctx.fillStyle = '#facc15';
            ctx.fill();
            ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke();

            // نمایش زوایا
            document.getElementById('angLeft').textContent  = deg1.toFixed(1);
            document.getElementById('angRight').textContent = deg2.toFixed(1);
        }
    } else {
        drawBase(lx, ly, '#38bdf8');
        drawBase(rx, ry, '#4ade80');
    }
}

// ========== حرکت نقطه هدف ==========
let currentX = 0, currentY = 150;

function setTarget(x, y, record = false) {
    const [a, b] = ik(x, y);
    if (a === null) return false;
    currentX = x; currentY = y;
    if (record) pathPoints.push({ x, y });
    document.getElementById('xVal').textContent = x.toFixed(0);
    document.getElementById('yVal').textContent = y.toFixed(0);
    document.getElementById('xSlider').value = x;
    document.getElementById('ySlider').value = y;
    redraw(x, y);
    return true;
}

// ========== ترسیم متن (بدون کتابخانه خارجی) ==========
function textToPath() {
    const text = document.getElementById('textInput').value.trim();
    if (!text) return;

    // رسم متن روی یک canvas مخفی، سپس استخراج پیکسل‌ها
    const off = document.createElement('canvas');
    off.width = 500; off.height = 120;
    const octx = off.getContext('2d');
    octx.fillStyle = 'black';
    octx.fillRect(0, 0, off.width, off.height);
    octx.fillStyle = 'white';
    octx.font = 'bold 60px Tahoma';
    octx.textBaseline = 'middle';
    octx.direction = 'rtl';
    octx.fillText(text, 20, 60);

    const imgData = octx.getImageData(0, 0, off.width, off.height).data;

    // پیدا کردن محدوده پیکسل‌های روشن
    let minX = 1e9, maxX = -1e9, minY = 1e9, maxY = -1e9;
    const pts = [];
    for (let py = 0; py < off.height; py++) {
        for (let px = 0; px < off.width; px++) {
            const i = (py * off.width + px) * 4;
            if (imgData[i] > 128) {
                pts.push({ x: px, y: py });
                if (px < minX) minX = px;
                if (px > maxX) maxX = px;
                if (py < minY) minY = py;
                if (py > maxY) maxY = py;
            }
        }
    }
    if (pts.length === 0) return;

    // نرمال‌سازی به مختصات ربات
    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;
    const w = maxX - minX || 1;
    const h = maxY - minY || 1;
    const scale = Math.min(180 / w, 90 / h) * 0.9;

    pathPoints = [];
    let lastPx = null;
    for (const p of pts) {
        // کاهش نمونه‌برداری برای سرعت
        if (lastPx && Math.hypot(p.x - lastPx.x, p.y - lastPx.y) < 3) continue;
        lastPx = p;
        const rx = (p.x - cx) * scale;
        const ry = 150 - (p.y - cy) * scale;
        if (ik(rx, ry)[0] !== null) {
            pathPoints.push({ x: rx, y: ry });
        }
    }

    if (pathPoints.length > 0) {
        const last = pathPoints[pathPoints.length - 1];
        setTarget(last.x, last.y, false);
    }
}

// ========== رویدادها ==========
document.getElementById('xSlider').addEventListener('input', e => {
    setTarget(parseFloat(e.target.value), currentY, false);
});
document.getElementById('ySlider').addEventListener('input', e => {
    setTarget(currentX, parseFloat(e.target.value), false);
});
document.getElementById('drawTextBtn').addEventListener('click', textToPath);
document.getElementById('clearBtn').addEventListener('click', () => {
    pathPoints = [];
    redraw(currentX, currentY);
});
document.getElementById('wsBtn').addEventListener('click', () => {
    showWorkspace = !showWorkspace;
    redraw(currentX, currentY);
});

// شروع
resizeCanvas();
setTarget(0, 150, false);