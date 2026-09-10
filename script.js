function formatNum(num) {
    if (num >= 1000000) return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
    return num;
}

function showToast(message) {
    let toast = document.getElementById("customToast");
    if (!toast) return;
    toast.innerText = message;
    toast.classList.add("show");
    setTimeout(() => { toast.classList.remove("show"); }, 3500);
}

function checkEnter(event) {
    if (event.key === "Enter") {
        handleLogin();
    }
}

let gameData = null;

function getDatabase() {
    let db = localStorage.getItem("pati_bebek_app_db_v2");
    if (!db) { db = { users: [] }; saveDatabase(db); } 
    else { db = JSON.parse(db); }
    return db;
}

function saveDatabase(db) { localStorage.setItem("pati_bebek_app_db_v2", JSON.stringify(db, null, 2)); }

const defaultQuests = [
    { id: 1, type: 'produce', desc: '50 Ürün Üret', target: 50, current: 0, rewardType: 'milk', rewardCount: 2, completed: false },
    { id: 2, type: 'hire', desc: '3 Bebek İşe Al', target: 3, current: 0, rewardType: 'food', rewardCount: 2, completed: false },
    { id: 3, type: 'upgrade', desc: '5 Kez Tesis Yükselt', target: 5, current: 0, rewardType: 'milk', rewardCount: 3, completed: false },
    { id: 4, type: 'level', desc: 'Sv.3 Bebek Yetiştir', target: 3, current: 0, rewardType: 'food', rewardCount: 3, completed: false },
    { id: 5, type: 'produce', desc: '200 Ürün Üret', target: 200, current: 0, rewardType: 'milk', rewardCount: 5, completed: false },
    { id: 6, type: 'hire', desc: '8 Bebek İşe Al', target: 8, current: 0, rewardType: 'food', rewardCount: 5, completed: false }
];

let currentUser = null;
let gold = 200;
let soupCount = 0;
let milkCount = 2; 
let foodCount = 2; 
let hireCost = 30;
let stations = [];
let allBabies = [];
let idleBabies = [];
let quests = [];
let avatar = "baby1.jpg";
let currentBabyIndex = 0;

async function loadGameData() {
    try {
        let response = await fetch("data.json");
        gameData = await response.json();
        initSession(); 
    } catch (error) {
        console.error("data.json yüklenirken hata:", error);
    }
}

function initSession() {
    const savedUser = localStorage.getItem("pati_bebek_aktif_oturum_v2");
    if (savedUser) {
        let db = getDatabase();
        let found = db.users.find(u => u.username === savedUser);
        if (found) {
            currentUser = found;
            loadUserData();
            document.getElementById("authScreen").style.display = "none";
            document.getElementById("gameScreen").style.display = "flex";
            document.getElementById("welcomeUser").innerText = currentUser.username;
            updateUI();
        }
    }
}

window.addEventListener("DOMContentLoaded", () => { loadGameData(); });

function handleRegister() {
    const user = document.getElementById("usernameInput").value.trim();
    const pass = document.getElementById("passwordInput").value.trim();
    const err = document.getElementById("authError");
    
    if (!user || !pass) { 
        err.style.color = "#d83b68";
        err.innerText = "Nickname ve şifre boş olamaz!"; 
        return; 
    }

    let db = getDatabase();
    
    if (db.users.find(u => u.username === user)) { 
        err.style.color = "#d83b68";
        err.innerText = "Böyle bir kullanıcı var! Bu nickname zaten alınmış."; 
        return; 
    }

    const template1 = gameData.babiesList[0];
    const template2 = gameData.babiesList[1];
    
    let initialBabies = [
        { id: Date.now() + 1, name: template1.name, gender: template1.gender, img: template1.img, traits: template1.traits, level: 1, xp: 0 },
        { id: Date.now() + 2, name: template2.name, gender: template2.gender, img: template2.img, traits: template2.traits, level: 1, xp: 0 }
    ];

    let newUser = {
        username: user, password: pass, gold: 200, soupCount: 0, milkCount: 2, foodCount: 2, hireCost: 30,
        level: 1,
        stations: [], 
        allBabies: initialBabies, 
        idleBabies: [initialBabies[1]],
        quests: JSON.parse(JSON.stringify(defaultQuests)),
        avatar: "baby1.jpg",
        lastLoginDate: "",
        lastSaveTime: Date.now()
    };

    db.users.push(newUser);
    saveDatabase(db);
    
    currentUser = newUser;
    localStorage.setItem("pati_bebek_aktif_oturum_v2", currentUser.username);
    loadUserData();
    
    if (stations.length > 0 && stations[0].baby === null && allBabies.length > 0) {
        stations[0].baby = allBabies[0];
        idleBabies = idleBabies.filter(b => b.id !== allBabies[0].id);
    }

    document.getElementById("authScreen").style.display = "none";
    document.getElementById("gameScreen").style.display = "flex";
    document.getElementById("welcomeUser").innerText = currentUser.username;
    updateUI();
}

function handleLogin() {
    const user = document.getElementById("usernameInput").value.trim();
    const pass = document.getElementById("passwordInput").value.trim();
    const err = document.getElementById("authError");

    if (!user || !pass) { 
        err.style.color = "#d83b68"; 
        err.innerText = "Nickname ve şifre boş olamaz!"; 
        return; 
    }

    let db = getDatabase();
    let userExists = db.users.find(u => u.username === user);

    if (!userExists) {
        err.style.color = "#d83b68";
        err.innerText = "Kayıtlı kullanıcı bulunamadı, lütfen önce Kayıt Olun!";
        return;
    }

    let found = db.users.find(u => u.username === user && u.password === pass);
    if (!found) { 
        err.style.color = "#d83b68"; 
        err.innerText = "Hatalı şifre!"; 
        return; 
    }

    currentUser = found;
    localStorage.setItem("pati_bebek_aktif_oturum_v2", currentUser.username);
    loadUserData();
    document.getElementById("authScreen").style.display = "none";
    document.getElementById("gameScreen").style.display = "flex";
    document.getElementById("welcomeUser").innerText = currentUser.username;
    updateUI();
}

function handleLogout() {
    saveUserData();
    localStorage.removeItem("pati_bebek_aktif_oturum_v2");
    currentUser = null;
    document.getElementById("gameScreen").style.display = "none";
    document.getElementById("authScreen").style.display = "flex";
    document.getElementById("usernameInput").value = "";
    document.getElementById("passwordInput").value = "";
    document.getElementById("authError").innerText = "";
}

function loadUserData() {
    gold = currentUser.gold || 200; 
    soupCount = currentUser.soupCount || 0; 
    milkCount = currentUser.milkCount !== undefined ? currentUser.milkCount : 2;
    foodCount = currentUser.foodCount !== undefined ? currentUser.foodCount : 2;
    hireCost = currentUser.hireCost || 30;
    avatar = currentUser.avatar || "baby1.jpg";
    currentUser.level = currentUser.level || (1 + Math.floor(soupCount / 50));
    
    allBabies = currentUser.allBabies || []; 
    idleBabies = currentUser.idleBabies || [];
    quests = currentUser.quests || JSON.parse(JSON.stringify(defaultQuests));

    let unlockedCount = Math.min(20, 1 + currentUser.level); 

    let savedStations = currentUser.stations || [];
    stations = [];

    for (let i = 0; i < unlockedCount; i++) {
        let defaultSt = gameData.defaultStations[i];
        let oldSt = savedStations.find(s => s.id === defaultSt.id);
        let stObj = oldSt ? oldSt : JSON.parse(JSON.stringify(defaultSt));
        
        if (!stObj.baby) {
            if (idleBabies.length > 0) {
                stObj.baby = idleBabies.shift();
            } else {
                let assignedBabyIds = stations.filter(s => s.baby).map(s => s.baby.id);
                let unassignedBaby = allBabies.find(b => !assignedBabyIds.includes(b.id));
                if (unassignedBaby) {
                    stObj.baby = unassignedBaby;
                }
            }
        }
        stations.push(stObj);
    }

    if (allBabies.length === 0 && gameData && gameData.babiesList) {
        const t1 = gameData.babiesList[0];
        const t2 = gameData.babiesList[1];
        allBabies = [
            { id: Date.now() + 1, name: t1.name, gender: t1.gender, img: t1.img, traits: t1.traits, level: 1, xp: 0 },
            { id: Date.now() + 2, name: t2.name, gender: t2.gender, img: t2.img, traits: t2.traits, level: 1, xp: 0 }
        ];
        idleBabies = [allBabies[1]];
        if (stations.length > 0) stations[0].baby = allBabies[0];
    }

    let todayStr = new Date().toDateString();
    if (currentUser.lastLoginDate !== todayStr) {
        currentUser.lastLoginDate = todayStr;
        milkCount += 2;
        foodCount += 2;
        showToast("🎁 Günlük Giriş Ödülü: +2 Süt, +2 Mama kazandın!");
    }

    let now = Date.now();
    let lastTime = currentUser.lastSaveTime || now;
    let diffSeconds = Math.floor((now - lastTime) / 1000);

    if (diffSeconds > 60) { 
        let offlineSoup = 0;
        let offlineGold = 0;
        stations.forEach(st => {
            if (st.baby) {
                let trait = st.baby.traits && st.baby.traits[st.name] ? st.baby.traits[st.name] : { multiplier: 1.0 };
                let spd = trait.multiplier + (st.baby.level * 0.1);
                let soupsPerSec = (st.productionRate * spd * 25) / 100;
                let produced = Math.floor(soupsPerSec * diffSeconds);
                offlineSoup += produced;
                offlineGold += produced * (5 * st.level);
            }
        });
        if (offlineSoup > 0) {
            soupCount += offlineSoup;
            gold += offlineGold;
            showToast(`👋 Hoş Geldin! Ürün: +${formatNum(offlineSoup)}, Altın: +${formatNum(offlineGold)}`);
        }
    }
}

function saveUserData() {
    if (!currentUser || !gameData) return;
    let db = getDatabase();
    let index = db.users.findIndex(u => u.username === currentUser.username);
    if (index !== -1) {
        db.users[index] = { 
            username: currentUser.username, password: currentUser.password, 
            gold, soupCount, milkCount, foodCount, hireCost, stations, allBabies, idleBabies, quests, avatar,
            level: currentUser.level,
            lastLoginDate: currentUser.lastLoginDate,
            lastSaveTime: Date.now() 
        };
        saveDatabase(db);
    }
}

function checkDynamicQuests() {
    quests.forEach(q => {
        if (!q.completed) {
            if (q.type === 'hire') q.current = allBabies.length;
            if (q.type === 'level') {
                const maxLvl = allBabies.length > 0 ? Math.max(...allBabies.map(b => b.level)) : 0;
                q.current = maxLvl;
            }
            if (q.current >= q.target) {
                q.current = q.target;
                q.completed = true;
            }
        }
    });
}

function showRegisterBox() {
    document.getElementById("loginBox").style.display = "none";
    document.getElementById("registerBox").style.display = "block";
    document.getElementById("authError").innerText = "";
}

function showLoginBox() {
    document.getElementById("registerBox").style.display = "none";
    document.getElementById("loginBox").style.display = "block";
    document.getElementById("regAuthError").innerText = "";
}

function checkRegisterEnter(event) {
    if (event.key === "Enter") {
        handleRegister();
    }
}

function updateUI() {
    if (!currentUser) return;
    loadUserData(); 
    checkLevelUp();
    checkDynamicQuests();

    let currentLevel = currentUser.level || 1;

    document.getElementById("gold").innerText = formatNum(gold);
    document.getElementById("soupCount").innerText = formatNum(soupCount);
    document.getElementById("milkCount").innerText = formatNum(milkCount);
    document.getElementById("foodCount").innerText = formatNum(foodCount);
    document.getElementById("collectionCount").innerText = allBabies.length;
    document.getElementById("stationCount").innerText = `${stations.length} (Sv.${currentLevel})`;

    const container = document.getElementById("stationsContainer");
    container.innerHTML = "";

    stations.forEach(st => {
        let workerHTML = ``;
        let cardClass = "station-card";

        if (st.baby) {
            cardClass += " working";
            let babyGlobalIndex = allBabies.findIndex(b => b.id === st.baby.id);
            workerHTML = `<div class="station-worker-box" onclick="openBabyDetail(${babyGlobalIndex})" title="Bebeğin detayını aç"><img src="${st.baby.img}" alt="Bebek"></div>`;
        } else {
            workerHTML = `<div class="station-empty-badge" onclick="openCollection()" title="Bebek Ata">+</div>`;
        }

        container.innerHTML += `
            <div class="${cardClass}" id="station-card-${st.id}">
                ${workerHTML}
                <img src="${st.foodImg}" class="food-img">
                <div class="station-title">${st.name}</div>
                <div class="station-lvl">Sv.${st.level}</div>
                <button class="upgrade-btn" onclick="upgradeStation(${st.id}); return false;">Yükselt<br>(${formatNum(st.upgradeCost)}🪙)</button>
            </div>
        `;
    });

    const idleContainer = document.getElementById("idleBabiesContainer");
    if (idleBabies.length === 0) {
        idleContainer.innerHTML = `<span class="empty-text">Boşta bebek yok.</span>`;
    } else {
        idleContainer.innerHTML = "";
        idleBabies.forEach((baby, idx) => {
            idleContainer.innerHTML += `
                <div class="idle-card">
                    <span><strong>${baby.name}</strong></span>
                    <div class="idle-card-btns">
                        <button class="game-btn" onclick="assignBaby(${idx})">Ata</button>
                        <button class="game-btn fire-btn" onclick="fireBaby(${idx})">Kov</button>
                    </div>
                </div>
            `;
        });
    }

    const questsContainer = document.getElementById("questsContainer");
    if(questsContainer) {
        questsContainer.innerHTML = "";
        quests.forEach(q => {
            let qPercent = Math.min(100, (q.current / q.target) * 100);
            let rewardName = q.rewardType === 'milk' ? `${q.rewardCount} Süt 🍼` : `${q.rewardCount} Mama 🥣`;
            let btnHTML = q.completed 
                ? `<button class="game-btn" style="width:100%;" onclick="claimQuest(${q.id})">Ödülü Al (${rewardName})</button>` 
                : `<button class="game-btn" style="width:100%;" disabled>Ödül: ${rewardName}</button>`;

            questsContainer.innerHTML += `
                <div class="quest-item">
                    <p>${q.desc}</p>
                    <div class="quest-progress-text">${formatNum(q.current)} / ${formatNum(q.target)}</div>
                    <div class="quest-progress-bg">
                        <div class="quest-progress-fill" style="width: ${qPercent}%;"></div>
                    </div>
                    ${btnHTML}
                </div>
            `;
        });
    }

    saveUserData();
}

function hireBaby() {
    if (allBabies.length >= 20) {
        showToast("Maksimum kapasiteye (20 bebek) ulaştın!");
        return;
    }
    if (gold >= hireCost) {
        gold -= hireCost;
        hireCost = Math.floor(hireCost * 1.3);
        const templateBaby = gameData.babiesList[Math.floor(Math.random() * gameData.babiesList.length)];
        const newBaby = {
            id: Date.now() + Math.random(),
            name: templateBaby.name, gender: templateBaby.gender, img: templateBaby.img,
            traits: templateBaby.traits, level: 1, xp: 0
        };
        allBabies.push(newBaby); 

        const emptySt = stations.find(s => s.baby === null);
        if (emptySt) {
            emptySt.baby = newBaby;
        } else {
            idleBabies.push(newBaby);
        }
        updateUI();
    } else {
        showToast("Yeterli altın yok! 🪙");
    }
}

function assignBaby(index) {
    const emptySt = stations.find(s => s.baby === null);
    if (!emptySt) { showToast("Boş istasyon kalmadı!"); return; }
    const baby = idleBabies.splice(index, 1)[0];
    emptySt.baby = baby;
    updateUI();
}

function unassignBaby(stationId) {
    const st = stations.find(s => s.id === stationId);
    if (st && st.baby) {
        idleBabies.push(st.baby);
        st.baby = null;
        updateUI();
    }
}

function fireBaby(index) {
    if(confirm("Bu bebeği kovmak istediğine emin misin?")) {
        let babyToFire = idleBabies[index];
        idleBabies.splice(index, 1);
        allBabies = allBabies.filter(b => b.id !== babyToFire.id);
        updateUI();
    }
}

function upgradeStation(id) {
    const st = stations.find(s => s.id === id);
    if (gold >= st.upgradeCost) {
        gold -= st.upgradeCost; 
        st.level += 1; 
        st.productionRate += 0.4;
        st.upgradeCost = Math.floor(st.upgradeCost * 1.4);
        
        let upgQuest = quests.find(q => q.type === 'upgrade' && !q.completed);
        if (upgQuest) {
            upgQuest.current += 1;
            if(upgQuest.current >= upgQuest.target) upgQuest.completed = true;
        }

        updateUI();
    } else {
        showToast("Yeterli altın yok! 🪙");
    }
}

function claimQuest(id) {
    const q = quests.find(qu => qu.id === id);
    if (q && q.completed) {
        if (q.rewardType === 'milk') milkCount += q.rewardCount;
        else foodCount += q.rewardCount;

        showToast(`🎁 Ödül Alındı: +${q.rewardCount} ${q.rewardType === 'milk' ? 'Süt 🍼' : 'Mama 🥣'}`);

        q.current = 0;
        q.target = Math.floor(q.target * 2); 
        q.rewardCount = Math.floor(q.rewardCount * 1.5);
        
        if (q.type === 'produce') q.desc = `${q.target} Ürün Üret`;
        else if (q.type === 'hire') q.desc = `${q.target} Bebek İşe Al`;
        else if (q.type === 'upgrade') q.desc = `${q.target} Kez Tesis Yükselt`;
        else if (q.type === 'level') q.desc = `Sv.${q.target} Bebek Yetiştir`;

        q.completed = false;
        saveUserData();
        updateUI();
    }
}

function openProfileModal() {
    const modal = document.getElementById("profileModal");
    const content = document.getElementById("profileContent");
    
    let currentLevel = currentUser.level || 1;
    let requiredGold = currentLevel * 2500;
    let requiredSoup = currentLevel * 300;

    let goldPercent = Math.min(100, (gold / requiredGold) * 100);
    let soupPercent = Math.min(100, (soupCount / requiredSoup) * 100);
    
    let avatarListHTML = `<div style="display:flex; gap:10px; justify-content:center; flex-wrap:wrap; margin:10px 0;">`;
    gameData.babiesList.forEach(b => {
        avatarListHTML += `<img src="${b.img}" onclick="changeAvatar('${b.img}')" style="width:45px; height:45px; border-radius:50%; object-fit:cover; cursor:pointer; border:2px solid ${avatar === b.img ? '#ff5c8a':'transparent'}">`;
    });
    avatarListHTML += `</div>`;

    content.innerHTML = `
        <span class="close-btn" onclick="closeProfileModal()">✕</span>
        <img src="${avatar}" style="width:90px; height:90px; border-radius:50%; object-fit:cover; border:3px solid #ff8fab; margin-bottom:10px;">
        <h3>${currentUser.username}</h3>
        <p style="margin:4px 0; color:#ff5c8a; font-weight:bold;">Seviye: ${currentLevel}</p>
        <p>🪙 Para: <strong>${formatNum(gold)}</strong></p>
        <p>🍼 Süt: <strong>${milkCount}</strong> | 🥣 Mama: <strong>${foodCount}</strong></p>
        <p>👶 Bebek Sayısı: <strong>${allBabies.length}</strong></p>
        <p>🏠 Açık Tesis: <strong>${stations.length}/20</strong></p>
        
        <hr style="border:1px solid #ffd1dc; margin:10px 0;">
        <p style="font-size:0.8rem; font-weight:bold; margin-bottom:4px;">Seviye İlerlemesi (Sv.${currentLevel} -> Sv.${currentLevel + 1}):</p>
        
        <div style="text-align:left; font-size:0.75rem; margin-bottom:6px;">
            <span>Altın Hedefi (${formatNum(gold)} / ${formatNum(requiredGold)}):</span>
            <div class="xp-container" style="margin:2px 0 6px 0;">
                <div class="xp-fill" style="width: ${goldPercent}%; background: linear-gradient(135deg, #ffd166, #ffb703);"></div>
            </div>
            <span>Ürün Hedefi (${formatNum(soupCount)} / ${formatNum(requiredSoup)}):</span>
            <div class="xp-container" style="margin:2px 0 4px 0;">
                <div class="xp-fill" style="width: ${soupPercent}%;"></div>
            </div>
        </div>

        <hr style="border:1px solid #ffd1dc; margin:10px 0;">
        <p style="font-size:0.8rem; font-weight:bold;">Avatarını Seç:</p>
        ${avatarListHTML}
    `;
    modal.style.display = "flex";
}

function closeProfileModal() { document.getElementById("profileModal").style.display = "none"; }

function changeAvatar(newImg) {
    avatar = newImg;
    currentUser.avatar = avatar;
    saveUserData();
    openProfileModal();
}

function openPlayersListModal() {
    const modal = document.getElementById("playersListModal");
    const content = document.getElementById("playersListContent");
    let db = getDatabase();

    content.innerHTML = "";
    if (db.users.length === 0) {
        content.innerHTML = `<p class="empty-text">Henüz başka oyuncu yok.</p>`;
    } else {
        db.users.forEach(u => {
            let uBabies = u.allBabies ? u.allBabies.length : 0;
            let uGold = u.gold ? formatNum(u.gold) : 0;
            let uAvatar = u.avatar || "baby1.jpg";
            let uLevel = u.level || (1 + Math.floor((u.soupCount || 0) / 50));
            
            content.innerHTML += `
                <div style="display:flex; align-items:center; justify-content:space-between; background:#fff0f3; padding:8px; border-radius:8px; margin-bottom:6px; cursor:pointer;" onclick="openOtherPlayerDetail('${u.username}')">
                    <div style="display:flex; align-items:center; gap:8px;">
                        <img src="${uAvatar}" style="width:35px; height:35px; border-radius:50%; object-fit:cover;">
                        <span style="font-weight:bold; font-size:0.85rem;">${u.username} (Sv.${uLevel})</span>
                    </div>
                    <span style="font-size:0.75rem; color:#777;">👶 ${uBabies} | 🪙 ${uGold}</span>
                </div>
            `;
        });
    }
    modal.style.display = "flex";
}

function closePlayersListModal() { document.getElementById("playersListModal").style.display = "none"; }

function openOtherPlayerDetail(username) {
    closePlayersListModal();
    let db = getDatabase();
    let targetUser = db.users.find(u => u.username === username);
    if (!targetUser) return;

    const modal = document.getElementById("otherPlayerDetailModal");
    const content = document.getElementById("otherPlayerContent");

    let tBabies = targetUser.allBabies ? targetUser.allBabies.length : 0;
    let tGold = targetUser.gold ? formatNum(targetUser.gold) : 0;
    let tStations = targetUser.stations ? targetUser.stations.length : 2;
    let tAvatar = targetUser.avatar || "baby1.jpg";
    let tLevel = targetUser.level || (1 + Math.floor((targetUser.soupCount || 0) / 50));

    content.innerHTML = `
        <span class="close-btn" onclick="closeOtherPlayerModal()">✕</span>
        <img src="${tAvatar}" style="width:90px; height:90px; border-radius:50%; object-fit:cover; border:3px solid #ff8fab; margin-bottom:10px;">
        <h3>${targetUser.username} (Sv.${tLevel})</h3>
        <p>🪙 Para: <strong>${tGold}</strong></p>
        <p>👶 Bebek Sayısı: <strong>${tBabies}</strong></p>
        <p>🏠 Tesis Sayısı: <strong>${tStations}/20</strong></p>
    `;
    modal.style.display = "flex";
}

function closeOtherPlayerModal() { document.getElementById("otherPlayerDetailModal").style.display = "none"; }

function openCollection() {
    const modal = document.getElementById("collectionModal");
    const grid = document.getElementById("collectionGrid");
    grid.innerHTML = "";

    if (allBabies.length === 0) {
        grid.innerHTML = `<span class="empty-text" style="grid-column: span 3;">Henüz hiç bebeğin yok.</span>`;
    } else {
        allBabies.forEach((baby, idx) => {
            grid.innerHTML += `
                <div class="collection-item" onclick="openBabyDetail(${idx})">
                    <img src="${baby.img}" alt="Bebek">
                    <span>${baby.name}</span>
                </div>
            `;
        });
    }
    modal.style.display = "flex";
}

function closeCollection() { document.getElementById("collectionModal").style.display = "none"; }
function prevBaby() { currentBabyIndex = (currentBabyIndex - 1 + allBabies.length) % allBabies.length; renderBabyDetailModal(); }
function nextBaby() { currentBabyIndex = (currentBabyIndex + 1) % allBabies.length; renderBabyDetailModal(); }

function openBabyDetail(index) {
    closeCollection();
    if (allBabies.length === 0) return;
    currentBabyIndex = index;
    renderBabyDetailModal();
    document.getElementById("babyDetailModal").style.display = "flex";
}

function renderBabyDetailModal() {
    const baby = allBabies[currentBabyIndex];
    const body = document.getElementById("babyDetailBody");

    let assignedStation = stations.find(s => s.baby && s.baby.id === baby.id);
    let workStatus = assignedStation ? `${assignedStation.name} Tesisinde Çalışıyor 🏭` : "Kreşte / Boşta 💤";

    baby.xp = baby.xp || 0;
    baby.level = baby.level || 1;
    let requiredXpForNext = baby.level * 30;
    let xpPercent = Math.min(100, (baby.xp / requiredXpForNext) * 100);

    body.innerHTML = `
        <span class="close-btn" onclick="closeBabyDetail()">✕</span>
        <div class="modal-nav-container">
            <button class="nav-btn" onclick="prevBaby()">&#10094;</button>
            <div class="detail-center">
                <img src="${baby.img}" alt="Bebek" class="detail-avatar">
                <div class="detail-info" style="width: 100%;">
                    <div style="margin-bottom:5px;">
                        <label style="font-size:0.75rem; color:#777;">İsim Düzenle:</label><br>
                        <input type="text" id="editBabyName" value="${baby.name}" oninput="changeBabyName('${baby.id}', this.value)" style="padding:4px 8px; border:2px solid #ffccd5; border-radius:8px; text-align:center; font-weight:bold; font-size:0.9rem; outline:none; width:120px;">
                    </div>
                    <p style="margin:2px 0;">Cinsiyet: <strong>${baby.gender}</strong></p>
                    <p style="margin:2px 0;">Görev: <strong>${workStatus}</strong></p>
                    <p style="margin:2px 0;">Seviye: <strong>Sv.${baby.level}</strong></p>
                    
                    <div style="width: 80%; margin: 0 auto;">
                        <div class="xp-container">
                            <div class="xp-fill" style="width: ${xpPercent}%;"></div>
                        </div>
                        <div class="xp-text">XP: ${baby.xp} / ${requiredXpForNext}</div>
                    </div>
                </div>
                
                <div style="display:flex; gap:8px; width:100%; margin-top:5px;">
                    <button class="game-btn primary-btn" style="flex:1; background:#4ea8de;" onclick="feedBabyWithItem('${baby.id}', 'milk')">Süt Ver (+5 XP) 🍼<br>(Sahip: ${milkCount})</button>
                    <button class="game-btn primary-btn" style="flex:1; background:#f77f00;" onclick="feedBabyWithItem('${baby.id}', 'food')">Mama Ver (+10 XP) 🥣<br>(Sahip: ${foodCount})</button>
                </div>
            </div>
            <button class="nav-btn" onclick="nextBaby()">&#10095;</button>
        </div>
    `;
}

function closeBabyDetail() { document.getElementById("babyDetailModal").style.display = "none"; }

function changeBabyName(babyId, newName) {
    let baby = allBabies.find(b => b.id == babyId);
    if (baby) {
        baby.name = newName;
        updateUI();
    }
}

function feedBabyWithItem(babyId, itemType) {
    const baby = allBabies.find(b => b.id == babyId);
    if (!baby) return;

    baby.xp = baby.xp || 0;
    baby.level = baby.level || 1;
    let requiredXpForNext = baby.level * 30;

    if (itemType === 'milk' && milkCount > 0) {
        milkCount--;
        baby.xp += 5;
        showToast(`🍼 ${baby.name} süt içti (+5 XP)!`);
    } else if (itemType === 'food' && foodCount > 0) {
        foodCount--;
        baby.xp += 10;
        showToast(`🥣 ${baby.name} mama yedi (+10 XP)!`);
    } else {
        showToast(`Yeterli ${itemType === 'milk' ? 'süt' : 'mama'} yok! Görevlerden kazanabilirsin.`);
        return;
    }

    while (baby.xp >= requiredXpForNext) {
        baby.xp -= requiredXpForNext;
        baby.level += 1;
        requiredXpForNext = baby.level * 30;
        showToast(`🎉 Harika! ${baby.name} Seviye ${baby.level} oldu! 🌟`);
    }

    renderBabyDetailModal();
    updateUI();
}

function checkLevelUp() {
    if (!currentUser) return;
    
    let currentLevel = currentUser.level || 1;
    let requiredGold = currentLevel * 2500;
    let requiredSoup = currentLevel * 300;

    if (gold >= requiredGold && soupCount >= requiredSoup) {
        currentUser.level = currentLevel + 1;
        let newLvl = currentUser.level;

        let rewardGold = newLvl * 500; 
        let rewardMilk = 2;            
        let rewardFood = 2;            

        gold += rewardGold;
        milkCount += rewardMilk;
        foodCount += rewardFood;

        if (gameData && gameData.babiesList) {
            let randomTemplate = gameData.babiesList[Math.floor(Math.random() * gameData.babiesList.length)];
            let newBaby = {
                id: Date.now() + Math.random(),
                name: randomTemplate.name,
                gender: randomTemplate.gender,
                img: randomTemplate.img,
                traits: randomTemplate.traits,
                level: 1,
                xp: 0
            };
            allBabies.push(newBaby);
            idleBabies.push(newBaby);
        }

        showLevelUpModal(newLvl, rewardGold, rewardMilk, rewardFood);
        saveUserData();
    }
}

function showLevelUpModal(level, rGold, rMilk, rFood) {
    const modal = document.getElementById("levelUpModal");
    const rewardsText = document.getElementById("levelUpRewards");
    
    rewardsText.innerHTML = `
        Tebrikler Miriy! Başarıyla <strong>Seviye ${level}</strong> oldun!<br><br>
        🎁 <strong>Kazanılan Ödüller:</strong><br>
        🪙 +${formatNum(rGold)} Altın<br>
        🍼 +${rMilk} Süt | 🥣 +${rFood} Mama<br>
        👶 +1 Yeni Bebek & 🏠 Yeni Tesis Kilidi Açıldı!
    `;
    
    modal.style.display = "flex";
}

function closeLevelUpModal() {
    document.getElementById("levelUpModal").style.display = "none";
    updateUI();
}

setInterval(() => {
    if (!currentUser || !gameData) return;
    let progressMade = false;
    stations.forEach(st => {
        if (st.baby) {
            let trait = st.baby.traits && st.baby.traits[st.name] ? st.baby.traits[st.name] : { multiplier: 1.0 };
            let spd = trait.multiplier + (st.baby.level * 0.1);
            
            if (typeof st.progress !== 'number' || isNaN(st.progress)) st.progress = 0;
            st.progress += st.productionRate * spd * 5;

            if (st.progress >= 100) {
                st.progress = 0; soupCount += 1; gold += 5 * st.level; progressMade = true;
                
                let prodQuest = quests.find(q => q.type === 'produce' && !q.completed);
                if (prodQuest) {
                    prodQuest.current += 1;
                    if (prodQuest.current >= prodQuest.target) prodQuest.completed = true;
                }
            }
        }
    });
    if (progressMade) updateUI();
}, 200);