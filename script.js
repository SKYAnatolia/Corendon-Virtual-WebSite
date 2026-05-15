// ============ CONFIGURATION ============
const DISCORD_WEBHOOK_URL = "YOUR_DISCORD_WEBHOOK_URL_HERE";
const STORAGE_USERS = "corendon_users";

// ============ DATA ============
let users = [];

function loadData() {
    const saved = localStorage.getItem(STORAGE_USERS);
    if (saved) {
        users = JSON.parse(saved);
    } else {
        users = [
            { username: "admin", password: "ADMIN1", hasChangedPassword: true, devices: [], flights: 0, hours: 0, rank: "Command Captain" }
        ];
        saveData();
    }
}

function saveData() {
    localStorage.setItem(STORAGE_USERS, JSON.stringify(users));
}

function findUser(username) {
    return users.find(u => u.username.toLowerCase() === username.toLowerCase());
}

function addUser(username, tempPassword) {
    if (findUser(username)) return { success: false, error: "User exists" };
    users.push({
        username: username,
        password: tempPassword,
        hasChangedPassword: false,
        devices: [],
        flights: 0,
        hours: 0,
        rank: "Cadet"
    });
    saveData();
    return { success: true };
}

function verifyLogin(username, password) {
    const user = findUser(username);
    if (!user) return { success: false, error: "User not found" };
    if (user.password !== password) return { success: false, error: "Wrong password" };
    return { success: true, user, needsPasswordChange: !user.hasChangedPassword };
}

function changePassword(username, newPassword) {
    const user = findUser(username);
    if (!user || newPassword.length !== 6) return false;
    user.password = newPassword;
    user.hasChangedPassword = true;
    saveData();
    return true;
}

// ============ DEVICE ============
async function getDeviceId() {
    const fp = await FingerprintJS.load();
    const result = await fp.get();
    return result.visitorId;
}

async function checkDeviceLimit(username, deviceId) {
    const user = findUser(username);
    if (!user) return { allowed: false };
    if (user.devices.includes(deviceId)) return { allowed: true };
    if (user.devices.length >= 2) return { allowed: false, limitReached: true };
    user.devices.push(deviceId);
    saveData();
    return { allowed: true };
}

// ============ DISCORD ============
async function sendDiscordNotification(message, type = "info") {
    if (DISCORD_WEBHOOK_URL === "YOUR_DISCORD_WEBHOOK_URL_HERE") return;
    const colors = { info: 0x3498db, warning: 0xf39c12, error: 0xe74c3c };
    await fetch(DISCORD_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            embeds: [{
                title: "Corendon VA",
                description: message,
                color: colors[type] || colors.info,
                timestamp: new Date().toISOString()
            }]
        })
    });
}

// ============ SESSION ============
function saveSession(username) { sessionStorage.setItem("currentUser", username); }
function getCurrentUser() { return sessionStorage.getItem("currentUser"); }
function clearSession() { sessionStorage.removeItem("currentUser"); }

// ============ UI ============
function showPage(pageId) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active-page'));
    const targetPage = document.getElementById(pageId + 'Page');
    if (targetPage) {
        targetPage.classList.add('active-page');
    }
    document.querySelectorAll('.dropdown').forEach(drop => {
        drop.classList.remove('active');
    });
    window.scrollTo(0, 0);
}

function updateUIForLogin(username) {
    document.getElementById('userStatus').innerHTML = `<span style="color:#CC0000; font-weight:bold;">👤 ${username}</span>`;
    document.getElementById('loginMenuBtn').style.display = 'none';
    document.getElementById('logoutMenuBtn').style.display = 'block';
    document.getElementById('crewCenterNav').style.display = 'block';
    document.getElementById('crewUsername').textContent = username;
    
    const user = findUser(username);
    if (user) {
        document.getElementById('totalFlights').textContent = user.flights || 0;
        document.getElementById('flightHours').textContent = user.hours || 0;
        document.getElementById('crewRank').textContent = user.rank || "Cadet";
    }
}

function updateUIForLogout() {
    document.getElementById('userStatus').innerHTML = '';
    document.getElementById('loginMenuBtn').style.display = 'block';
    document.getElementById('logoutMenuBtn').style.display = 'none';
    document.getElementById('crewCenterNav').style.display = 'none';
}

// ============ LOGIN FLOW ============
let pendingUser = null;

async function handleLogin() {
    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value.trim();
    const errorEl = document.getElementById('loginError');
    
    const result = verifyLogin(username, password);
    if (!result.success) {
        errorEl.textContent = result.error;
        return;
    }
    
    const deviceId = await getDeviceId();
    const deviceCheck = await checkDeviceLimit(username, deviceId);
    
    if (!deviceCheck.allowed) {
        if (deviceCheck.limitReached) {
            document.getElementById('loginModal').classList.remove('active');
            pendingUser = username;
            document.getElementById('deviceLimitModal').classList.add('active');
        }
        return;
    }
    
    saveSession(username);
    
    if (result.needsPasswordChange) {
        pendingUser = username;
        document.getElementById('loginModal').classList.remove('active');
        document.getElementById('changePwdModal').classList.add('active');
    } else {
        document.getElementById('loginModal').classList.remove('active');
        updateUIForLogin(username);
        showPage('crewcenter');
    }
    
    errorEl.textContent = "";
    document.getElementById('loginUsername').value = "";
    document.getElementById('loginPassword').value = "";
}

async function handlePasswordChange() {
    const newPwd = document.getElementById('newPassword').value;
    const confirmPwd = document.getElementById('confirmNewPassword').value;
    
    if (newPwd.length !== 6) {
        document.getElementById('changePwdError').textContent = "Password must be 6 characters";
        return;
    }
    if (newPwd !== confirmPwd) {
        document.getElementById('changePwdError').textContent = "Passwords don't match";
        return;
    }
    
    if (changePassword(pendingUser, newPwd)) {
        await sendDiscordNotification(`${pendingUser} changed their password`, "success");
        document.getElementById('changePwdModal').classList.remove('active');
        updateUIForLogin(pendingUser);
        showPage('crewcenter');
        pendingUser = null;
    }
}

function handleLogout() {
    clearSession();
    updateUIForLogout();
    showPage('home');
}

function openLoginModal() {
    document.getElementById('loginModal').classList.add('active');
}

function closeModals() {
    document.querySelectorAll('.modal').forEach(m => m.classList.remove('active'));
}

async function notifyAdmin() {
    const deviceId = await getDeviceId();
    await sendDiscordNotification(`⚠️ DEVICE LIMIT: ${pendingUser} tried to add device ${deviceId.substring(0,20)}...`, "warning");
    alert("Admin notified. You will be contacted.");
    closeModals();
}

// ============ DROPDOWN SETUP ============
function setupDropdowns() {
    document.querySelectorAll('.dropdown-toggle').forEach(toggle => {
        toggle.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const parent = toggle.closest('.dropdown');
            document.querySelectorAll('.dropdown').forEach(drop => {
                if (drop !== parent) drop.classList.remove('active');
            });
            parent.classList.toggle('active');
        });
    });
    
    document.body.addEventListener('click', (e) => {
        if (!e.target.closest('.dropdown')) {
            document.querySelectorAll('.dropdown').forEach(drop => {
                drop.classList.remove('active');
            });
        }
    });
}

// ============ INIT ============
async function checkLoginStatus() {
    const currentUser = getCurrentUser();
    if (currentUser) {
        const deviceId = await getDeviceId();
        const user = findUser(currentUser);
        if (user && user.devices.includes(deviceId)) {
            updateUIForLogin(currentUser);
            showPage('crewcenter');
        } else {
            clearSession();
            updateUIForLogout();
            showPage('home');
        }
    } else {
        updateUIForLogout();
        showPage('home');
    }
}

// ============ EVENT LISTENERS ============
document.addEventListener('DOMContentLoaded', async () => {
    loadData();
    await checkLoginStatus();
    setupDropdowns();
    
    document.getElementById('loginMenuBtn').addEventListener('click', openLoginModal);
    document.getElementById('logoutMenuBtn').addEventListener('click', handleLogout);
    document.getElementById('loginBtn').addEventListener('click', handleLogin);
    document.getElementById('confirmChangeBtn').addEventListener('click', handlePasswordChange);
    document.getElementById('notifyAdminBtn').addEventListener('click', notifyAdmin);
    document.getElementById('closeDeviceModal').addEventListener('click', closeModals);
    
    document.querySelectorAll('.close').forEach(btn => {
        btn.addEventListener('click', closeModals);
    });
    
    document.querySelectorAll('.main-nav a').forEach(link => {
        link.addEventListener('click', (e) => {
            const page = link.getAttribute('data-page');
            if (page) {
                e.preventDefault();
                showPage(page);
            }
        });
    });
    
    document.getElementById('loginPassword').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleLogin();
    });
    
    const changePwdBtn = document.getElementById('changePwdFromCrewBtn');
    if (changePwdBtn) {
        changePwdBtn.addEventListener('click', () => {
            pendingUser = getCurrentUser();
            document.getElementById('changePwdModal').classList.add('active');
        });
    }
});

// EXPORT FOR ADMIN
window.CorendonVA = { 
    getUsers: () => users, 
    addUser, 
    removeDevice: (username, deviceId) => {
        const user = findUser(username);
        if (user) { const idx = user.devices.indexOf(deviceId); if (idx > -1) { user.devices.splice(idx,1); saveData(); return true; } }
        return false;
    }, 
    getAllUsers: () => users.filter(u => u.username !== "admin"), 
    deleteUser: (username) => {
        const idx = users.findIndex(u => u.username === username);
        if (idx > -1) { users.splice(idx,1); saveData(); return true; }
        return false;
    }
};

window.showPage = showPage;
