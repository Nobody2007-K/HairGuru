/* ====================================================
   CONFIG — change API_BASE to your backend URL
==================================================== */
const API_BASE = 'http://localhost:5000/api';  // Flask default. Change for production.

/* ====================================================
   STATE
==================================================== */
let authToken = localStorage.getItem('hg_token') || null;
let currentUser = JSON.parse(localStorage.getItem('hg_user') || 'null');
let selectedFile = null;
let lastResult = null;

/* ====================================================
   CURSOR
==================================================== */
const cur = document.getElementById('cur');
const curR = document.getElementById('cur-ring');

// Move both cursor dots on every mouse move
document.addEventListener('mousemove', e => {
    cur.style.left = e.clientX + 'px';
    cur.style.top = e.clientY + 'px';
    // Ring follows with a slight lag
    setTimeout(() => {
        curR.style.left = e.clientX + 'px';
        curR.style.top = e.clientY + 'px';
    }, 80);
});

// Hide cursor when it leaves the window
document.addEventListener('mouseleave', () => {
    cur.style.opacity = '0';
    curR.style.opacity = '0';
});
document.addEventListener('mouseenter', () => {
    cur.style.opacity = '1';
    curR.style.opacity = '0.6';
});

// Use event delegation so dynamically added elements (gallery cards, history cards, etc.)
// are always covered — no need to re-attach listeners after renderGallery / renderHistory
const HOVER_SELECTOR = 'a, button, input, label, .gallery-card, .shape-card, .how-card, .history-card, .filter-btn';

document.addEventListener('mouseover', e => {
    if (e.target.closest(HOVER_SELECTOR)) {
        cur.style.transform = 'translate(-50%,-50%) scale(2.5)';
        curR.style.transform = 'translate(-50%,-50%) scale(1.4)';
        curR.style.opacity = '1';
        curR.style.borderColor = 'var(--rust)';
    }
});

document.addEventListener('mouseout', e => {
    if (e.target.closest(HOVER_SELECTOR)) {
        cur.style.transform = 'translate(-50%,-50%) scale(1)';
        curR.style.transform = 'translate(-50%,-50%) scale(1)';
        curR.style.opacity = '0.6';
        curR.style.borderColor = 'var(--rust)';
    }
});

/* ====================================================
   NAV
==================================================== */
window.addEventListener('scroll', () => {
    document.getElementById('mainNav').classList.toggle('scrolled', window.scrollY > 60);
});
function toggleMobileMenu() {
    document.getElementById('navLinks').classList.toggle('open');
}

/* ====================================================
   TOAST
==================================================== */
function showToast(msg, type = 'info') {
    const t = document.getElementById('toast');
    document.getElementById('toastMsg').textContent = msg;
    t.className = `toast ${type} show`;
    setTimeout(() => t.classList.remove('show'), 3500);
}

/* ====================================================
   AUTH STATE
==================================================== */
function updateAuthUI() {
    const loggedIn = !!(authToken && currentUser);
    document.getElementById('authButtons').style.display = loggedIn ? 'none' : 'flex';
    document.getElementById('userMenuWrap').style.display = loggedIn ? 'block' : 'none';
    if (loggedIn && currentUser) {
        document.getElementById('userNameDisplay').textContent = currentUser.username;
        document.getElementById('userAvatar').textContent = currentUser.username[0].toUpperCase();
    }
}
function toggleUserMenu() {
    document.getElementById('userDropdown').classList.toggle('show');
}
document.addEventListener('click', e => {
    if (!e.target.closest('.user-menu')) {
        document.getElementById('userDropdown').classList.remove('show');
    }
});

/* ====================================================
   MODALS
==================================================== */
function openModal(type) {
    document.getElementById(type + 'Modal').classList.add('show');
    document.body.style.overflow = 'hidden';
}
function closeModal(type) {
    document.getElementById(type + 'Modal').classList.remove('show');
    document.body.style.overflow = '';
}
function switchModal(from, to) {
    closeModal(from);
    setTimeout(() => openModal(to), 200);
}
// Close on overlay click
document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', e => {
        if (e.target === overlay) {
            overlay.classList.remove('show');
            document.body.style.overflow = '';
        }
    });
});

/* ====================================================
   AUTH: LOGIN
==================================================== */
async function handleLogin() {
    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value;
    let valid = true;

    document.getElementById('loginUsernameErr').classList.remove('show');
    document.getElementById('loginPasswordErr').classList.remove('show');
    document.getElementById('loginError').classList.remove('show');

    if (!username) { document.getElementById('loginUsernameErr').classList.add('show'); valid = false; }
    if (!password) { document.getElementById('loginPasswordErr').classList.add('show'); valid = false; }
    if (!valid) return;

    try {
        const res = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Login failed');
        authToken = data.token;
        currentUser = data.user;
        localStorage.setItem('hg_token', authToken);
        localStorage.setItem('hg_user', JSON.stringify(currentUser));
        closeModal('login');
        updateAuthUI();
        loadHistory();
        showToast(`Welcome back, ${currentUser.username}!`, 'success');
    } catch (err) {
        const errBox = document.getElementById('loginError');
        errBox.textContent = err.message;
        errBox.classList.add('show');
    }
}

/* ====================================================
   AUTH: REGISTER
==================================================== */
async function handleRegister() {
    const username = document.getElementById('regUsername').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const password = document.getElementById('regPassword').value;
    const confirm = document.getElementById('regConfirm').value;
    let valid = true;

    ['regUsernameErr', 'regEmailErr', 'regPasswordErr', 'regConfirmErr'].forEach(id =>
        document.getElementById(id).classList.remove('show'));
    document.getElementById('registerError').classList.remove('show');

    if (username.length < 3) { document.getElementById('regUsernameErr').classList.add('show'); valid = false; }
    if (!email.includes('@')) { document.getElementById('regEmailErr').classList.add('show'); valid = false; }
    if (password.length < 8) { document.getElementById('regPasswordErr').classList.add('show'); valid = false; }
    if (password !== confirm) { document.getElementById('regConfirmErr').classList.add('show'); valid = false; }
    if (!valid) return;

    try {
        const res = await fetch(`${API_BASE}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, password })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Registration failed');
        authToken = data.token;
        currentUser = data.user;
        localStorage.setItem('hg_token', authToken);
        localStorage.setItem('hg_user', JSON.stringify(currentUser));
        closeModal('register');
        updateAuthUI();
        showToast(`Account created! Welcome, ${currentUser.username}`, 'success');
    } catch (err) {
        const errBox = document.getElementById('registerError');
        errBox.textContent = err.message;
        errBox.classList.add('show');
    }
}

/* ====================================================
   AUTH: LOGOUT
==================================================== */
function logout() {
    authToken = null;
    currentUser = null;
    localStorage.removeItem('hg_token');
    localStorage.removeItem('hg_user');
    updateAuthUI();
    document.getElementById('historyGrid').style.display = 'none';
    document.getElementById('historyEmpty').style.display = 'block';
    document.getElementById('historyEmptyMsg').textContent = 'Log in to view your analysis history';
    showToast('Logged out successfully', 'info');
}

/* ====================================================
   FILE UPLOAD
==================================================== */
function handleFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { showToast('File too large. Max 10MB.', 'error'); return; }
    selectedFile = file;

    // Preview
    const reader = new FileReader();
    reader.onload = evt => {
        document.getElementById('previewImg').src = evt.target.result;
        document.getElementById('uploadPreview').style.display = 'block';
        document.getElementById('selectedFileName').textContent = file.name;
        document.getElementById('filenameDisplay').style.display = 'block';
    };
    reader.readAsDataURL(file);

    document.getElementById('analyzeBtn').disabled = false;

    // Reset result panel
    document.getElementById('resultPanel').classList.remove('show');
    document.getElementById('idlePlaceholder').style.display = 'block';
}

function resetUpload() {
    selectedFile = null;
    lastResult = null;
    document.getElementById('photoInput').value = '';
    document.getElementById('uploadPreview').style.display = 'none';
    document.getElementById('filenameDisplay').style.display = 'none';
    document.getElementById('previewImg').src = '';
    document.getElementById('analyzeBtn').disabled = true;
    document.getElementById('resultPanel').classList.remove('show');
    document.getElementById('loadingState').classList.remove('show');
    document.getElementById('idlePlaceholder').style.display = 'block';
}

// Drag & drop
const uploadArea = document.getElementById('uploadArea');
['dragenter', 'dragover'].forEach(ev => uploadArea.addEventListener(ev, e => { e.preventDefault(); uploadArea.classList.add('drag-over'); }));
['dragleave', 'drop'].forEach(ev => uploadArea.addEventListener(ev, e => { e.preventDefault(); uploadArea.classList.remove('drag-over'); }));
uploadArea.addEventListener('drop', e => {
    const file = e.dataTransfer.files[0];
    if (file) {
        document.getElementById('photoInput').files = e.dataTransfer.files;
        handleFile({ target: { files: [file] } });
    }
});

/* ====================================================
   ANALYSIS
==================================================== */
async function startAnalysis() {
    if (!selectedFile) return;

    document.getElementById('idlePlaceholder').style.display = 'none';
    document.getElementById('resultPanel').classList.remove('show');
    document.getElementById('loadingState').classList.add('show');
    document.getElementById('analyzeBtn').disabled = true;

    // Animate steps
    const steps = ['step1', 'step2', 'step3', 'step4', 'step5'];
    steps.forEach(s => {
        const el = document.getElementById(s);
        el.className = 'loader-step';
    });

    let dotsCount = 0;
    const dotsInterval = setInterval(() => {
        document.getElementById('loadDots').textContent = '.'.repeat((dotsCount++ % 3) + 1);
    }, 400);

    // Simulate realistic step progression
    const stepTimings = [200, 600, 1100, 1800, 2400];
    steps.forEach((s, i) => {
        setTimeout(() => {
            if (i > 0) document.getElementById(steps[i - 1]).className = 'loader-step done';
            document.getElementById(s).className = 'loader-step active';
        }, stepTimings[i]);
    });

    try {
        const formData = new FormData();
        formData.append('image', selectedFile);

        const headers = {};
        if (authToken) headers['Authorization'] = `Bearer ${authToken}`;

        const res = await fetch(`${API_BASE}/analyze`, { method: 'POST', headers, body: formData });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Analysis failed');

        clearInterval(dotsInterval);
        setTimeout(() => {
            document.getElementById(steps[steps.length - 1]).className = 'loader-step done';
            setTimeout(() => {
                document.getElementById('loadingState').classList.remove('show');
                renderResult(data);
            }, 400);
        }, stepTimings[stepTimings.length - 1] + 200);

        lastResult = data;

    } catch (err) {
        clearInterval(dotsInterval);
        // ── DEMO MODE: simulate result when backend not connected ──
        const demoData = {
            primary_shape: 'Oval',
            confidence: 0.83,
            all_confidences: { Oval: 0.83, Round: 0.09, Square: 0.05, Heart: 0.02, Oblong: 0.01 },
            recommended: ['Side Part Taper', 'Textured Quiff', 'Crew Cut / Ivy League', 'Slick Back', 'French Crop'],
            avoid: ['Buzz Cut (no guard)', 'Ultra Boxy Flat-Top'],
            tip: 'Your oval face shape is the most versatile — almost every haircut works. Focus on styles that celebrate your natural balance. Avoid extremes; your goal is elegance, not compensation.'
        };
        clearInterval(dotsInterval);
        setTimeout(() => {
            document.getElementById(steps[steps.length - 1]).className = 'loader-step done';
            setTimeout(() => {
                document.getElementById('loadingState').classList.remove('show');
                renderResult(demoData);
                showToast('Demo mode — backend not connected', 'info');
            }, 400);
        }, stepTimings[stepTimings.length - 1] + 200);
        lastResult = demoData;
        console.warn('Backend not reachable, using demo data:', err.message);
    }
}

function renderResult(data) {
    document.getElementById('resultShape').textContent = data.primary_shape.toUpperCase();
    document.getElementById('resultConf').textContent = `Primary Shape · ${Math.round(data.confidence * 100)}% confidence`;

    // Confidence bars
    const barsHtml = Object.entries(data.all_confidences)
        .sort((a, b) => b[1] - a[1])
        .map(([shape, pct]) => `
      <div class="conf-row">
        <span class="conf-label">${shape}</span>
        <div class="conf-bar-bg"><div class="conf-bar" style="width:${Math.round(pct * 100)}%"></div></div>
        <span class="conf-pct">${Math.round(pct * 100)}%</span>
      </div>`).join('');
    document.getElementById('confBars').innerHTML = barsHtml;

    // Cuts
    document.getElementById('resultCuts').innerHTML = data.recommended
        .map(c => `<span class="cut-chip">${c}</span>`).join('');

    // Avoid
    document.getElementById('resultAvoid').innerHTML = data.avoid
        .map(c => `<span class="cut-chip">${c}</span>`).join('');

    // Tip
    document.getElementById('resultTip').textContent = data.tip;

    document.getElementById('resultPanel').classList.add('show');
    document.getElementById('analyzeBtn').disabled = false;
    document.getElementById('analyzeBtn').textContent = 'Analyze Again';
}

/* ====================================================
   SAVE ANALYSIS
==================================================== */
async function saveAnalysis() {
    if (!authToken) { openModal('login'); return; }
    if (!lastResult) return;
    try {
        const res = await fetch(`${API_BASE}/analyses`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` },
            body: JSON.stringify({ result: lastResult, image_filename: selectedFile?.name })
        });
        if (!res.ok) throw new Error('Failed to save');
        showToast('Analysis saved to your profile!', 'success');
        loadHistory();
    } catch (err) {
        showToast('Save failed. Try again.', 'error');
    }
}

/* ====================================================
   LOAD HISTORY
==================================================== */
async function loadHistory() {
    if (!authToken) return;
    try {
        const res = await fetch(`${API_BASE}/analyses`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        const data = await res.json();
        if (!res.ok || !data.length) {
            document.getElementById('historyEmpty').style.display = 'block';
            document.getElementById('historyGrid').style.display = 'none';
            document.getElementById('historyEmptyMsg').textContent = 'No analyses yet — analyze your face to get started';
            return;
        }
        renderHistory(data);
    } catch {
        // Silently fail if backend not available
    }
}

function renderHistory(analyses) {
    document.getElementById('historyEmpty').style.display = 'none';
    const grid = document.getElementById('historyGrid');
    grid.style.display = 'grid';
    grid.innerHTML = analyses.map(a => `
    <div class="history-card">
      <div class="history-card-date">${new Date(a.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
      <div class="history-card-shape">${(a.primary_shape || '').toUpperCase()}</div>
      <div class="history-card-cuts">${(a.recommended || []).slice(0, 3).join(' · ')}</div>
    </div>
  `).join('');
}

/* ====================================================
   GALLERY
==================================================== */
const galleryStyles = [
    { name: 'Side Part Taper', shapes: ['oval', 'square', 'oblong'], img: 'https://images.unsplash.com/photo-1519345182560-3f2917c472ef?w=400&q=70' },
    { name: 'Crew Cut / Ivy League', shapes: ['all'], img: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&q=70' },
    { name: 'Textured Quiff', shapes: ['oval', 'round', 'heart'], img: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=400&q=70' },
    { name: 'Slick Back', shapes: ['oval', 'square'], img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=70' },
    { name: 'French Crop', shapes: ['round', 'heart'], img: 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=400&q=70' },
    { name: 'Undercut', shapes: ['oval', 'oblong', 'square'], img: 'https://images.unsplash.com/photo-1605497788044-5a32c7078486?w=400&q=70' },
    { name: 'Caesar Cut', shapes: ['round', 'heart'], img: 'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=400&q=70' },
    { name: 'Buzz Cut', shapes: ['oval', 'square'], img: 'https://images.unsplash.com/photo-1520975916090-3105956dac38?w=400&q=70' },
];

function renderGallery(filter = 'all') {
    const grid = document.getElementById('galleryGrid');
    const filtered = filter === 'all'
        ? galleryStyles
        : galleryStyles.filter(s => s.shapes.includes(filter) || s.shapes.includes('all'));

    grid.innerHTML = filtered.map(s => `
    <div class="gallery-card" data-shapes="${s.shapes.join(',')}">
      <img src="${s.img}" alt="${s.name}" loading="lazy">
      <div class="gallery-overlay">
        <div class="gallery-style-name">${s.name}</div>
        <div class="gallery-shape-tag">${filter === 'all' ? s.shapes.join(' · ') : filter} face</div>
      </div>
    </div>
  `).join('');
}

function filterGallery(type, btn) {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    renderGallery(type);
}

/* ====================================================
   INIT
==================================================== */
document.addEventListener('DOMContentLoaded', () => {
    updateAuthUI();
    renderGallery();
    if (authToken && currentUser) loadHistory();
});

// Keyboard: close modals on Escape
document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
        ['login', 'register'].forEach(closeModal);
        document.body.style.overflow = '';
    }
    if (e.key === 'Enter') {
        if (document.getElementById('loginModal').classList.contains('show')) handleLogin();
        if (document.getElementById('registerModal').classList.contains('show')) handleRegister();
    }
});