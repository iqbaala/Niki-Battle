const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// DOM Elements
const modeScreen = document.getElementById('mode-select-screen');
const charScreen = document.getElementById('character-select-screen');
const weaponScreen = document.getElementById('weapon-select-screen');
const battleScreen = document.getElementById('battle-screen');
const countryGrid = document.getElementById('country-grid');
const weaponGrid = document.getElementById('weapon-grid');
const weaponTargetName = document.getElementById('weapon-target-name');

const gameOverScreen = document.getElementById('game-over-screen');
const winnerText = document.getElementById('winner-text');
const restartBtn = document.getElementById('restart-btn');

// Image Loader
const loadedImages = {};
function getImg(src) {
    if (!loadedImages[src]) {
        const img = new Image();
        img.src = src;
        loadedImages[src] = img;
    }
    return loadedImages[src];
}

// Sound Loader
const sounds = {
    tap: new Audio('Sound effect/tap.mp3'),
    clash: new Audio('Sound effect/weapon clash.mp3'),
    swordHit: new Audio('Sound effect/sword hit.mp3'),
    hammerHit: new Audio('Sound effect/hammer hit.mp3'),
    batPunch: new Audio('Sound effect/Bat Punch.mp3')
};

function playSound(type) {
    if (!sounds[type]) return;
    const sound = sounds[type].cloneNode();
    let vol = 0.5;
    if (type === 'tap') vol = 0.2;
    if (type === 'clash') vol = 0.4;
    if (type === 'swordHit' || type === 'hammerHit') vol = 1.0;
    sound.volume = vol;
    sound.play().catch(e => console.log('Audio error:', e));
}

// Game State
let gameMode = '1v1';
let currentPlayerIndex = 1;
let totalPlayersNeeded = 2;
let pickedCharacters = [];
let selectedConfigs = [];
let selectionState = 'CHAR';

let players = [];
let bloodSplatters = [];
let bullets = [];
let trails = [];
let globalPacingMultiplier = 1.0;
let screenShake = 0;
let sparks = [];
let floatingTexts = [];

function spawnFloatingText(x, y, text, color) {
    floatingTexts.push({
        x: x,
        y: y,
        text: text,
        color: color,
        life: 1.0,
        vx: (Math.random() - 0.5) * 1.5,
        vy: -2.5
    });
}

// Data Mapping
const countryNames = [
    "United States", "Russia", "China", "India", "South Korea",
    "United Kingdom", "Japan", "Turkey", "Pakistan", "Italy",
    "France", "Brazil", "Indonesia", "Iran", "Egypt",
    "Australia", "Israel", "Ukraine", "Germany", "Spain"
];

const countries = countryNames.map((name, index) => ({
    name: name,
    img: `Asset Character/${index + 1}.png`,
    color: "#fff"
}));

// Weapons Config
const weapons = [
    { name: "Dagger", type: "melee", damage: 4, cooldown: 200, spinSpeed: 0.015, hitSound: "swordHit", critChance: 0.30, critMult: 2.0, lifesteal: 0, img: "Asset Senjata/Dagger.png" },
    { name: "Sword", type: "melee", damage: 5, cooldown: 400, spinSpeed: 0.01, hitSound: "swordHit", critChance: 0, critMult: 1, lifesteal: 0, img: "Asset Senjata/Sword.png" },
    { name: "Fuhma Shuriken", type: "melee", damage: 4, cooldown: 100, spinSpeed: 0.02, hitSound: "swordHit", critChance: 0, critMult: 1, lifesteal: 0, img: "Asset Senjata/Fuhma Shuriken.png" },
    { name: "Katana", type: "melee", damage: 6, cooldown: 400, spinSpeed: 0.012, hitSound: "swordHit", critChance: 0.20, critMult: 2.0, lifesteal: 0, img: "Asset Senjata/Katana.png" },
    { name: "Long Sword", type: "melee", damage: 7, cooldown: 600, spinSpeed: 0.008, hitSound: "swordHit", critChance: 0.15, critMult: 2.0, lifesteal: 0, img: "Asset Senjata/Long Sword.png" },
    { name: "Spear", type: "melee", damage: 6, cooldown: 600, spinSpeed: 0.008, hitSound: "swordHit", critChance: 0, critMult: 1, lifesteal: 0, img: "Asset Senjata/Spear.png" },
    { name: "Maze", type: "melee", damage: 8, cooldown: 800, spinSpeed: 0.006, hitSound: "hammerHit", critChance: 0.10, critMult: 3.0, lifesteal: 0, img: "Asset Senjata/Maze.png" },
    { name: "War Axe", type: "melee", damage: 9, cooldown: 900, spinSpeed: 0.005, hitSound: "hammerHit", critChance: 0, critMult: 1, lifesteal: 0, img: "Asset Senjata/War Axe.png" },
    { name: "Halberd", type: "melee", damage: 9, cooldown: 1000, spinSpeed: 0.004, hitSound: "hammerHit", critChance: 0, critMult: 1, lifesteal: 0, img: "Asset Senjata/Halberd.png" },
    { name: "War Hammer", type: "melee", damage: 10, cooldown: 1500, spinSpeed: 0.003, hitSound: "hammerHit", critChance: 0.25, critMult: 2.0, lifesteal: 0, img: "Asset Senjata/War Hammer.png" },
    { name: "Pistol", type: "ranged", projCount: 1, projSpread: 0, projSpeed: 10, projImg: "Efek Senjata/Pistol.png", shootInterval: 800, damage: 6, cooldown: 0, spinSpeed: 0.005, hitSound: "swordHit", critChance: 0.10, critMult: 2.0, lifesteal: 0, img: "Asset Senjata 2/Pistol.png" },
    { name: "Shotgun", type: "ranged", projCount: 3, projSpread: 0.4, projSpeed: 8, projImg: "Efek Senjata/Shotgun.png", shootInterval: 1500, damage: 5, cooldown: 0, spinSpeed: 0.003, hitSound: "swordHit", critChance: 0, critMult: 1, lifesteal: 0, img: "Asset Senjata 2/ShotGun.png" },
    { name: "Bow", type: "ranged", projCount: 1, projSpread: 0, projSpeed: 9, projImg: "Efek Senjata/Panah.png", shootInterval: 1000, damage: 7, cooldown: 0, spinSpeed: 0.004, hitSound: "batPunch", critChance: 0.20, critMult: 2.0, lifesteal: 0, img: "Asset Senjata 2/Bow.png" },
    { name: "Torch", type: "trail", dropInterval: 600, trailDuration: 3000, trailImg: "Efek Senjata/Torch.png", damage: 4, cooldown: 500, spinSpeed: 0.008, hitSound: "batPunch", lifesteal: 0, img: "Asset Senjata 2/Torch.png" },
    { name: "Bat", type: "melee", damage: 6, cooldown: 500, spinSpeed: 0.008, hitSound: "batPunch", critChance: 0.15, critMult: 2.0, lifesteal: 0, img: "Asset Senjata 2/Bat.png" },
    { name: "Boomerang", type: "ranged", projCount: 1, projSpread: 0, projSpeed: 6, projImg: "Asset Senjata 2/Boomerang.png", shootInterval: 900, damage: 7, cooldown: 0, spinSpeed: 0.01, hitSound: "batPunch", critChance: 0.20, critMult: 2.0, lifesteal: 0, img: "Asset Senjata 2/Boomerang.png" },
    { name: "Pan", type: "melee", damage: 8, cooldown: 700, spinSpeed: 0.006, hitSound: "hammerHit", critChance: 0.10, critMult: 2.5, lifesteal: 0, img: "Asset Senjata 2/Pan.png" },
    { name: "Shield", type: "melee", damage: 5, cooldown: 400, spinSpeed: 0.005, hitSound: "hammerHit", critChance: 0, critMult: 1, lifesteal: 0, img: "Asset Senjata 2/Shield.png" },
    { name: "Shuriken", type: "ranged", projCount: 1, projSpread: 0, projSpeed: 12, projImg: "Asset Senjata 2/Shuriken.png", shootInterval: 400, damage: 4, cooldown: 0, spinSpeed: 0.02, hitSound: "batPunch", critChance: 0.25, critMult: 2.0, lifesteal: 0, img: "Asset Senjata 2/Shuriken.png" },
    { name: "Shyte", type: "melee", damage: 10, cooldown: 1200, spinSpeed: 0.004, hitSound: "swordHit", critChance: 0, critMult: 1, lifesteal: 0.50, img: "Asset Senjata 2/Shyte.png" }
];

// 20 Unique Skills
const skillsConfig = {
    "United States": { name: "Rapid Fire", maxHits: 6, duration: 3000 },
    "Russia": { name: "Iron Defense", maxHits: 5, duration: 4000 },
    "China": { name: "Dragon Trail", maxHits: 7, duration: 4000 },
    "India": { name: "Heal", maxHits: 5 },
    "South Korea": { name: "Turbo Spin", maxHits: 5, duration: 6000 },
    "United Kingdom": { name: "Royal Volley", maxHits: 5 },
    "Japan": { name: "Shadow Clone", maxHits: 5, duration: 4000 },
    "Turkey": { name: "Ottoman Force", maxHits: 4, duration: 5000 },
    "Pakistan": { name: "Swift Dash", maxHits: 5 },
    "Italy": { name: "Gladiator Rage", maxHits: 5, duration: 5000 },
    "France": { name: "Tactical Slow", maxHits: 4, duration: 4000 },
    "Brazil": { name: "Carnival Rush", maxHits: 5, duration: 5000 },
    "Indonesia": { name: "Arrow Rain", maxHits: 5, duration: 3000 },
    "Iran": { name: "Wall Resilience", maxHits: 6, duration: 5000 },
    "Egypt": { name: "Cursed Aura", maxHits: 5, duration: 5000 },
    "Australia": { name: "Boomerang Storm", maxHits: 5, duration: 4000 },
    "Israel": { name: "Fire Aura", maxHits: 5, duration: 4000 },
    "Ukraine": { name: "Shield", maxHits: 5, duration: 4000 },
    "Germany": { name: "Second Weapon", maxHits: 5, duration: 5000 },
    "Spain": { name: "Damage Reflect", maxHits: 5, duration: 5000 }
};

// --- Menu Flow ---

function buildCharacterGrid() {
    countryGrid.innerHTML = '';
    countries.forEach(country => {
        const btn = document.createElement('div');
        btn.className = 'card-btn';
        const skillName = skillsConfig[country.name]?.name || "Skill";
        btn.innerHTML = `<img src="${country.img}" class="card-img"><div class="card-name">${country.name}</div><div class="card-stat" style="color: #666; font-size: 8px;">${skillName}</div>`;
        btn.onclick = () => selectCharacter(country);
        countryGrid.appendChild(btn);
    });
}

function buildWeaponGrid() {
    weaponGrid.innerHTML = '';
    weapons.forEach(weapon => {
        const btn = document.createElement('div');
        btn.className = 'card-btn';
        btn.innerHTML = `<img src="${weapon.img}" class="card-img"><div class="card-name">${weapon.name}</div><div class="card-stat">DMG: ${weapon.damage}</div>`;
        btn.onclick = () => selectWeapon(weapon);
        weaponGrid.appendChild(btn);
    });
}

function updateCharSelectionInstruction() {
    let turnTextElement = document.getElementById('char-turn-text');
    if (!turnTextElement) return;

    if (gameMode === '2v2') {
        let teamName = (currentPlayerIndex <= 2) ? "Team A" : "Team B";
        let teamColor = (currentPlayerIndex <= 2) ? "#6da366" : "#c73636";
        turnTextElement.innerHTML = `${currentPlayerIndex} (<span style="color: ${teamColor}; font-weight: bold;">${teamName}</span>)`;
    } else if (gameMode === 'br8') {
        turnTextElement.innerHTML = `${currentPlayerIndex} (Solo)`;
    } else {
        let teamName = (currentPlayerIndex === 1) ? "Player 1" : "Player 2";
        turnTextElement.innerHTML = `${currentPlayerIndex} (${teamName})`;
    }
}

function updateWeaponSelectionInstruction() {
    let base = pickedCharacters[currentPlayerIndex - 1];
    let weaponTargetName = document.getElementById('weapon-target-name');
    if (!weaponTargetName || !base) return;

    if (gameMode === '2v2') {
        let teamName = (currentPlayerIndex <= 2) ? "Team A" : "Team B";
        let teamColor = (currentPlayerIndex <= 2) ? "#6da366" : "#c73636";
        weaponTargetName.innerHTML = `<span style="color: ${teamColor}; font-weight: bold;">${base.char.name} (${teamName})</span>`;
    } else {
        weaponTargetName.innerHTML = `<span style="font-weight: bold;">${base.char.name}</span>`;
    }
}

function selectMode(mode) {
    gameMode = mode;
    totalPlayersNeeded = (mode === '1v1') ? 2 : (mode === '2v2' ? 4 : 9);
    currentPlayerIndex = 1; pickedCharacters = []; selectedConfigs = []; selectionState = 'CHAR';
    updateCharSelectionInstruction();
    modeScreen.classList.add('hidden');
    charScreen.classList.remove('hidden');
}

function selectCharacter(country) {
    let teamId = (gameMode === '1v1') ? currentPlayerIndex - 1 : (gameMode === '2v2' ? (currentPlayerIndex <= 2 ? 0 : 1) : currentPlayerIndex - 1);
    pickedCharacters.push({ char: country, teamId: teamId });
    if (currentPlayerIndex < totalPlayersNeeded) {
        currentPlayerIndex++;
        updateCharSelectionInstruction();
    } else {
        selectionState = 'WEAPON'; currentPlayerIndex = 1;
        charScreen.classList.add('hidden'); weaponScreen.classList.remove('hidden');
        updateWeaponSelectionInstruction();
    }
}

function selectWeapon(weapon) {
    let base = pickedCharacters[currentPlayerIndex - 1];
    selectedConfigs.push({ char: base.char, weapon: weapon, teamId: base.teamId });
    if (currentPlayerIndex < totalPlayersNeeded) {
        currentPlayerIndex++;
        updateWeaponSelectionInstruction();
    } else {
        weaponScreen.classList.add('hidden'); battleScreen.classList.remove('hidden');
        startBattle();
    }
}

function goBack(screen) {
    if (screen === 'CHAR') {
        if (currentPlayerIndex > 1) {
            currentPlayerIndex--;
            pickedCharacters.pop();
            updateCharSelectionInstruction();
        } else {
            charScreen.classList.add('hidden');
            modeScreen.classList.remove('hidden');
        }
    } else if (screen === 'WEAPON') {
        if (currentPlayerIndex > 1) {
            currentPlayerIndex--;
            selectedConfigs.pop();
            updateWeaponSelectionInstruction();
        } else {
            selectionState = 'CHAR';
            currentPlayerIndex = totalPlayersNeeded;
            pickedCharacters.pop();
            weaponScreen.classList.add('hidden');
            charScreen.classList.remove('hidden');
            updateCharSelectionInstruction();
        }
    }
}

// --- Character Class ---

class Character {
    constructor(x, y, config) {
        this.name = config.char.name;
        this.img = getImg(config.char.img);
        this.weapon = config.weapon;
        this.weaponImg = getImg(config.weapon.img);
        this.teamId = config.teamId;
        this.x = x; this.y = y;

        let isBR = (gameMode === 'br8');
        this.radius = isBR ? 18 : 30;
        this.weaponOrbitRadius = isBR ? 39 : 65;
        this.weaponRadius = isBR ? 21 : 35;
        this.weaponAngle = 0;

        this.spinDirection = 1; this.hp = 100; this.maxHp = 100; this.vx = (Math.random() - 0.5) * 8; this.vy = (Math.random() - 0.5) * 8;
        this.hitCooldown = 0; this.flashTimer = 0; this.weaponClashCooldown = 0;
        this.speedMultiplier = 1.0; this.baseSpinSpeed = config.weapon.spinSpeed;

        // Skill Mechanics
        this.skillConfig = skillsConfig[this.name] || { name: "Skill", maxHits: 5 };
        this.skillPoints = 0;
        this.skillActive = false;
        this.skillTimer = 0;
        this.invincible = false;
        this.damageMultiplier = 1.0;
        this.knockbackMult = 1.0;
        this.damageReduction = 0;
        this.reflectDamage = false;
        this.siphonLife = false;
        this.cursedAura = false;
        this.clones = [];
        this.extraSpinAngle = 0;
        this.wallResilienceValue = 0;
        this.indonesiaShield = 0;
        this.healFlashTimer = 0;

        this.shootTimer = config.weapon.shootInterval || 0;
        this.trailTimer = config.weapon.dropInterval || 0;
    }

    update(deltaTime) {
        if (this.hp <= 0) return;
        if (this.hitCooldown > 0) this.hitCooldown -= deltaTime;
        if (this.flashTimer > 0) this.flashTimer -= deltaTime;
        if (this.weaponClashCooldown > 0) this.weaponClashCooldown -= deltaTime;
        if (this.healFlashTimer > 0) this.healFlashTimer -= deltaTime;

        let isBR = (gameMode === 'br8');

        // Skill Timer logic
        if (this.skillTimer > 0) {
            this.skillTimer -= deltaTime;
            if (this.skillTimer <= 0) this.deactivateSkill();
        }

        // Skill-specific continuous updates
        if (this.skillActive) {
            if (this.name === "United States") {
                this.trailTimer -= deltaTime;
                if (this.trailTimer <= 0) {
                    this.trailTimer = 150; // Shoot every 150ms
                    let target = players.find(p => p !== this && p.hp > 0 && p.teamId !== this.teamId);
                    if (target) {
                        let angle = Math.atan2(target.y - this.y, target.x - this.x) + (Math.random() - 0.5) * 0.3;
                        bullets.push({ x: this.x, y: this.y, vx: Math.cos(angle) * 12, vy: Math.sin(angle) * 12, img: getImg("Efek Senjata/Pistol.png"), owner: this, angle: angle, size: isBR ? 42 : 70, damage: 1 });
                    }
                }
            }
            if (this.name === "China") {
                this.trailTimer -= deltaTime; if (this.trailTimer <= 0) { this.trailTimer = 200; trails.push({ x: this.x, y: this.y, duration: 2000, maxDuration: 2000, owner: this, img: getImg("Efek Senjata/Torch.png"), size: isBR ? 42 : 70 }); }
            }
            if (this.name === "Indonesia") {
                this.trailTimer -= deltaTime;
                if (this.trailTimer <= 0) {
                    this.trailTimer = 500;
                    bullets.push({ x: Math.random() * 430, y: -50, vx: 0, vy: 10, img: getImg("Efek Senjata/Panah.png"), owner: this, angle: Math.PI / 2, size: isBR ? 42 : 70 });
                }
            }
            if (this.name === "Germany") {
                this.trailTimer -= deltaTime;
                if (this.trailTimer <= 0) {
                    this.trailTimer = 800;
                    let target = players.find(p => p !== this && p.hp > 0 && p.teamId !== this.teamId);
                    let angle = target ? Math.atan2(target.y - this.y, target.x - this.x) : this.weaponAngle;
                    bullets.push({ x: this.x, y: this.y, vx: Math.cos(angle) * 12, vy: Math.sin(angle) * 12, img: getImg("Efek Senjata/Pistol.png"), owner: this, angle: angle, size: isBR ? 30 : 50 });
                }
            }
            if (this.cursedAura) {
                players.forEach(p => {
                    if (p !== this && p.hp > 0 && p.teamId !== this.teamId) {
                        let dist = Math.hypot(p.x - this.x, p.y - this.y);
                        if (dist < (isBR ? 90 : 150)) p.hp -= 0.5 * (deltaTime / 1000); // 0.5 damage per second
                    }
                });
            }
            if (this.name === "France") {
                players.forEach(p => {
                    if (p !== this && p.teamId !== this.teamId) {
                        let dist = Math.hypot(p.x - this.x, p.y - this.y);
                        if (dist < (isBR ? 90 : 150)) p.speedMultiplier = 0.7;
                        else if (p.speedMultiplier < 1.0) p.speedMultiplier = 1.0;
                    }
                });
            }
            if (this.name === "Brazil") { this.speedMultiplier = 1.5; }
            if (this.name === "Japan") {
                this.clones.forEach((c, idx) => {
                    let targetAngle = this.weaponAngle + (idx + 1) * (Math.PI * 2 / 3);
                    c.x = this.x + Math.cos(targetAngle) * (this.radius * 2);
                    c.y = this.y + Math.sin(targetAngle) * (this.radius * 2);
                });
            }
        }

        // Standard Weapon Shoot
        if (this.weapon.type === 'ranged' && this.hp > 0) {
            this.shootTimer -= deltaTime * globalPacingMultiplier;
            if (this.shootTimer <= 0) {
                this.shootTimer = this.weapon.shootInterval;
                for (let i = 0; i < this.weapon.projCount; i++) {
                    let angle = this.weaponAngle + (Math.random() - 0.5) * this.weapon.projSpread;
                    bullets.push({ x: this.x + Math.cos(this.weaponAngle) * (this.weaponOrbitRadius + 5), y: this.y + Math.sin(this.weaponAngle) * (this.weaponOrbitRadius + 5), vx: Math.cos(angle) * this.weapon.projSpeed, vy: Math.sin(angle) * this.weapon.projSpeed, img: getImg(this.weapon.projImg), owner: this, angle: angle, size: isBR ? 42 : 70 });
                }
            }
        } else if (this.weapon.type === 'trail' && this.hp > 0) {
            this.trailTimer -= deltaTime * globalPacingMultiplier;
            if (this.trailTimer <= 0) { this.trailTimer = this.weapon.dropInterval; trails.push({ x: this.x, y: this.y, duration: this.weapon.trailDuration, maxDuration: this.weapon.trailDuration, owner: this, img: getImg(this.weapon.trailImg), size: isBR ? 54 : 90 }); }
        }

        let spinMult = 1.0;
        if (this.skillActive) {
            if (this.name === "South Korea") spinMult = 1.7;
            if (this.name === "Brazil") spinMult = 1.4;
        }

        this.weaponAngle += this.weapon.spinSpeed * spinMult * this.spinDirection * deltaTime * globalPacingMultiplier;
        if (this.speedMultiplier > 1.0) this.speedMultiplier -= 0.003 * deltaTime;
        if (this.speedMultiplier < 1.0) this.speedMultiplier += 0.003 * deltaTime;
        this.vy += 0.01; // Gravity
        this.x += this.vx * this.speedMultiplier * globalPacingMultiplier;
        this.y += this.vy * this.speedMultiplier * globalPacingMultiplier;

        let hitWall = false;
        if (this.x - this.radius < 25) { this.x = this.radius + 25; this.vx = Math.abs(this.vx); hitWall = true; }
        else if (this.x + this.radius > 405) { this.x = 405 - this.radius; this.vx = -Math.abs(this.vx); hitWall = true; }
        if (this.y - this.radius < 25) { this.y = this.radius + 25; this.vy = Math.abs(this.vy); hitWall = true; }
        else if (this.y + this.radius > 405) { this.y = 405 - this.radius; this.vy = -Math.abs(this.vy); hitWall = true; }

        // Central Wall collision (BR mode only)
        if (gameMode === 'br8') {
            let minX = 195, maxX = 235, minY = 130, maxY = 300;
            let closestX = Math.max(minX, Math.min(this.x, maxX));
            let closestY = Math.max(minY, Math.min(this.y, maxY));

            let dx = this.x - closestX;
            let dy = this.y - closestY;
            let dist = Math.hypot(dx, dy);

            if (dist < this.radius) {
                let overlap = this.radius - dist;
                if (dist === 0) {
                    let leftDist = this.x - minX;
                    let rightDist = maxX - this.x;
                    let topDist = this.y - minY;
                    let bottomDist = maxY - this.y;
                    let minDist = Math.min(leftDist, rightDist, topDist, bottomDist);
                    if (minDist === leftDist) { this.x = minX - this.radius; this.vx = -Math.abs(this.vx); }
                    else if (minDist === rightDist) { this.x = maxX + this.radius; this.vx = Math.abs(this.vx); }
                    else if (minDist === topDist) { this.y = minY - this.radius; this.vy = -Math.abs(this.vy); }
                    else { this.y = maxY + this.radius; this.vy = Math.abs(this.vy); }
                } else {
                    let nx = dx / dist;
                    let ny = dy / dist;
                    this.x += nx * overlap;
                    this.y += ny * overlap;

                    if (nx !== 0) this.vx = nx * Math.abs(this.vx) * 0.8;
                    if (ny !== 0) this.vy = ny * Math.abs(this.vy) * 0.8;
                }
                hitWall = true;
            }
        }

        if (hitWall) { playSound('tap'); this.speedMultiplier = 1.8; if (this.skillActive && this.name === "Iran") { this.hp = Math.min(this.maxHp, this.hp + 2); this.healFlashTimer = 150; spawnFloatingText(this.x, this.y - 20, "+2", '#33ff33'); } }
    }

    getWeaponPosition() {
        return { x: this.x + Math.cos(this.weaponAngle) * this.weaponOrbitRadius, y: this.y + Math.sin(this.weaponAngle) * this.weaponOrbitRadius };
    }

    takeDamage(attacker, hX, hY, isProjectile = false, customDamage = null) {
        if (this.hp <= 0 || this.hitCooldown > 0 || this.invincible) return false;

        // Indonesia blocks damage 1 time after special skill is active
        if (this.name === "Indonesia" && this.indonesiaShield > 0) {
            this.indonesiaShield--;
            playSound('tap');
            screenShake = 5;
            this.flashTimer = 50;
            return false; // Blocks hit completely!
        }

        let actualDamageReduction = this.damageReduction;
        if (this.skillActive && this.name === "Russia") return false; // Immune to everything

        let isCrit = Math.random() < attacker.weapon.critChance;
        if (attacker.guaranteedCrit > 0) { isCrit = true; attacker.guaranteedCrit--; }

        let damage = customDamage !== null ? customDamage : attacker.weapon.damage * attacker.damageMultiplier;
        if (!isProjectile && attacker.weapon.type === 'ranged' && customDamage === null) damage *= 0.2;
        if (isCrit) damage *= attacker.weapon.critMult;

        // Apply Shield/Reduction
        damage *= (1 - actualDamageReduction);

        // Reflect damage for Spain
        if (this.skillActive && this.name === "Spain" && attacker !== this) {
            let reflectDmg = damage * 0.5;
            attacker.hp -= reflectDmg; // Reflect 50%
            attacker.flashTimer = 100;
            let refText = reflectDmg % 1 === 0 ? reflectDmg.toFixed(0) : reflectDmg.toFixed(1);
            spawnFloatingText(attacker.x, attacker.y - 20, `-${refText}`, '#ff3333');
        }

        // Life Siphon for Israel
        if (attacker.skillActive && attacker.siphonLife) {
            attacker.hp = Math.min(attacker.maxHp, attacker.hp + 2);
            attacker.healFlashTimer = 150;
            spawnFloatingText(attacker.x, attacker.y - 20, "+2", '#33ff33');
        }

        this.hp -= damage; this.hitCooldown = 400; this.flashTimer = 100;
        let dmgText = damage % 1 === 0 ? damage.toFixed(0) : damage.toFixed(1);
        spawnFloatingText(this.x, this.y - 20, `-${dmgText}`, '#ff3333');

        screenShake = isCrit ? 15 : 5;
        if (attacker.weapon.lifesteal > 0) {
            let lsAmt = damage * attacker.weapon.lifesteal;
            attacker.hp = Math.min(attacker.maxHp, attacker.hp + lsAmt);
            attacker.healFlashTimer = 150;
            let lsText = lsAmt % 1 === 0 ? lsAmt.toFixed(0) : lsAmt.toFixed(1);
            spawnFloatingText(attacker.x, attacker.y - 20, `+${lsText}`, '#33ff33');
        }

        // Blood Splatters
        bloodSplatters.push({ x: hX, y: hY, size: 30 + Math.random() * 40, angle: Math.random() * Math.PI * 2, life: 1.0, maxLife: 1.0 });

        // Knockback
        if (!(this.skillActive && this.name === "Russia")) {
            let dx = this.x - hX, dy = this.y - hY, dist = Math.hypot(dx, dy);
            this.vx += (dx / dist) * 10 * attacker.knockbackMult; this.vy += (dy / dist) * 10 * attacker.knockbackMult;
        }

        return true;
    }

    draw(ctx) {
        if (this.hp <= 0) return;
        ctx.save(); ctx.translate(this.x, this.y);
        ctx.beginPath(); ctx.arc(0, 0, this.radius, 0, Math.PI * 2); ctx.clip();
        if (this.img.complete) ctx.drawImage(this.img, -this.radius, -this.radius, this.radius * 2, this.radius * 2);

        // Damage Flash (Blink Red)
        if (this.flashTimer > 0) { ctx.fillStyle = 'rgba(255, 0, 0, 0.7)'; ctx.fill(); }

        // Heal Flash (Blink Green)
        if (this.healFlashTimer > 0) { ctx.fillStyle = 'rgba(0, 255, 0, 0.7)'; ctx.fill(); }

        // Skill Cool Blue Blink
        if (this.skillActive && Math.floor(Date.now() / 150) % 2 === 0) {
            ctx.fillStyle = 'rgba(0, 150, 255, 0.5)';
            ctx.fill();
        }

        ctx.restore();

        ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2); ctx.lineWidth = 4;
        ctx.strokeStyle = ['#6da366', '#c73636', '#3b78c9', '#e8a33a', '#9444b0', '#32a89c', '#a83267', '#8a8536'][this.teamId] || '#333';
        ctx.stroke();

        // White Shield Circle Outline
        let hasShield = this.invincible || (this.damageReduction > 0) || this.reflectDamage || (this.name === "Indonesia" && this.indonesiaShield > 0);
        if (hasShield) {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius + 4, 0, Math.PI * 2);
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 6;
            ctx.stroke();
        }

        ctx.fillStyle = '#fff'; ctx.font = 'bold 20px "Fredoka One"'; ctx.textAlign = 'center'; ctx.lineWidth = 3; ctx.strokeStyle = '#000';
        ctx.strokeText(Math.ceil(this.hp), this.x, this.y + 7); ctx.fillText(Math.ceil(this.hp), this.x, this.y + 7);

        let wx = this.x + Math.cos(this.weaponAngle) * this.weaponOrbitRadius, wy = this.y + Math.sin(this.weaponAngle) * this.weaponOrbitRadius;
        ctx.save(); ctx.translate(wx, wy); ctx.rotate(this.weaponAngle + Math.PI / 2);
        if (this.weaponImg.complete) ctx.drawImage(this.weaponImg, -this.weaponRadius, -this.weaponRadius, this.weaponRadius * 2, this.weaponRadius * 2);
        ctx.restore();

        // Clones
        this.clones.forEach(c => {
            ctx.save(); ctx.globalAlpha = 0.5; ctx.translate(c.x, c.y);
            ctx.beginPath(); ctx.arc(0, 0, this.radius * 0.8, 0, Math.PI * 2); ctx.clip();
            if (this.img.complete) ctx.drawImage(this.img, -this.radius * 0.8, -this.radius * 0.8, this.radius * 1.6, this.radius * 1.6);
            ctx.restore();
            ctx.beginPath(); ctx.arc(c.x, c.y, this.radius * 0.8, 0, Math.PI * 2); ctx.lineWidth = 2; ctx.strokeStyle = '#fff'; ctx.stroke();
        });
    }

    activateSkill() {
        if (this.skillActive) return;
        this.skillActive = true; this.skillTimer = this.skillConfig.duration || 1000; this.skillPoints = 0; screenShake = 10;
        let isBR = (gameMode === 'br8');

        switch (this.name) {
            case "United States":
                this.trailTimer = 0;
                break;
            case "India": this.hp = Math.min(this.maxHp, this.hp + 7); this.healFlashTimer = 150; spawnFloatingText(this.x, this.y - 20, "+7", '#33ff33'); this.deactivateSkill(); break;
            case "United Kingdom":
                for (let i = 0; i < 8; i++) { let a = i * (Math.PI * 2 / 8); bullets.push({ x: this.x, y: this.y, vx: Math.cos(a) * 10, vy: Math.sin(a) * 10, img: getImg("Efek Senjata/Pistol.png"), owner: this, angle: a, size: isBR ? 42 : 70 }); }
                this.deactivateSkill(); break;
            case "Turkey": this.knockbackMult = 2.2; break;
            case "Pakistan":
                let tPak = players.find(p => p !== this && p.hp > 0 && p.teamId !== this.teamId);
                if (tPak) {
                    let a = Math.atan2(tPak.y - this.y, tPak.x - this.x);
                    this.vx = Math.cos(a) * 20; this.vy = Math.sin(a) * 20; this.speedMultiplier = 2.5;
                    tPak.takeDamage(this, this.x, this.y); // Medium damage hit
                }
                this.deactivateSkill(); break;
            case "Italy": this.damageMultiplier = 1.4; break;
            case "Japan": this.clones = [{ x: 0, y: 0 }, { x: 0, y: 0 }]; break;
            case "Australia":
                let baseAngle = Math.random() * Math.PI * 2;
                for (let i = 0; i < 4; i++) {
                    let a = baseAngle + i * (Math.PI * 2 / 4);
                    bullets.push({ x: this.x, y: this.y, vx: Math.cos(a) * 8, vy: Math.sin(a) * 8, img: getImg("Asset Senjata 2/Boomerang.png"), owner: this, angle: a, size: isBR ? 48 : 80, bounces: true, life: 4000 });
                }
                break;
            case "Ukraine": this.damageReduction = 0.5; break;
            case "Russia": this.invincible = true; break; // Handled in takeDamage for knockback
            case "Spain": this.reflectDamage = true; break;
            case "Israel": this.siphonLife = true; break;
            case "Egypt": this.cursedAura = true; break;
            case "Indonesia":
                this.trailTimer = 0;
                this.indonesiaShield = 1;
                break;
        }
    }

    deactivateSkill() {
        this.skillActive = false; this.skillTimer = 0; this.invincible = false; this.damageMultiplier = 1.0; this.knockbackMult = 1.0;
        this.damageReduction = 0; this.reflectDamage = false; this.clones = []; this.indonesiaShield = 0;
        this.skillPoints = 0;
        players.forEach(p => { if (p.speedMultiplier < 1.0) p.speedMultiplier = 1.0; });
    }
}

// --- Game Loop ---

function createHudCardHtml(p, idx) {
    let teamColors = ['#6da366', '#c73636', '#3b78c9', '#e8a33a', '#9444b0', '#32a89c', '#a83267', '#8a8536'];
    return `<div class="hud-card" id="hud-${idx}" style="border-color: ${teamColors[p.teamId]}; min-width: 90px; padding: 4px; gap: 5px; border-radius: 6px;">
        <img src="${p.img.src}" class="hud-img" style="border-color: ${teamColors[p.teamId]}; width: 28px; height: 28px; border-radius: 50%;">
        <div class="hud-bars-container" style="width: 58px;">
            <div class="hud-name" style="font-size: 10px; font-weight: bold; font-family: 'Fredoka One', cursive; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: white;">${p.name}</div>
            <div class="hud-bar" style="height: 4px; margin-top: 1px;"><div class="hud-hp-fill" id="hp-fill-${idx}"></div></div>
            <div class="hud-bar" style="height: 4px; margin-top: 1px;"><div class="hud-skill-fill" id="skill-fill-${idx}"></div></div>
        </div>
    </div>`;
}

function startBattle() {
    bloodSplatters = []; bullets = []; trails = []; sparks = []; globalPacingMultiplier = 1.0; players = []; floatingTexts = [];

    selectedConfigs.forEach(c => {
        let x, y, safe = false;
        let attempts = 0;
        while (!safe && attempts < 100) {
            x = 60 + Math.random() * 310;
            y = 60 + Math.random() * 310;
            attempts++;
            if (gameMode === 'br8') {
                // Wall area: x: 195-235, y: 130-300. Add some padding.
                let pad = 35;
                if (x >= 195 - pad && x <= 235 + pad && y >= 130 - pad && y <= 300 + pad) {
                    continue;
                }
            }
            safe = true;
        }
        players.push(new Character(x, y, c));
    });

    // Build HUD with VS
    const hud = document.getElementById('battle-hud'); hud.innerHTML = '';

    if (gameMode === '2v2') {
        hud.innerHTML = `
            <div style="display: flex; flex-direction: column; width: 100%; align-items: center; gap: 4px;">
                <div style="display: flex; justify-content: space-between; width: 90%; font-size: 11px; text-shadow: 2px 2px 0 #000;">
                    <div style="color: #6da366; font-weight: bold;">Team A (${players[0].name} & ${players[1].name})</div>
                    <div style="color: #ffca28; font-weight: bold;">VS</div>
                    <div style="color: #c73636; font-weight: bold; text-align: right;">Team B (${players[2].name} & ${players[3].name})</div>
                </div>
                <div style="display: flex; justify-content: center; align-items: center; gap: 10px; width: 100%;">
                    <div style="display: flex; gap: 4px;">
                        ${createHudCardHtml(players[0], 0)}
                        ${createHudCardHtml(players[1], 1)}
                    </div>
                    <div style="color: white; font-size: 14px; text-shadow: 2px 2px 0 #000; font-weight: bold;">VS</div>
                    <div style="display: flex; gap: 4px;">
                        ${createHudCardHtml(players[2], 2)}
                        ${createHudCardHtml(players[3], 3)}
                    </div>
                </div>
            </div>
        `;
    } else {
        let teamColors = ['#6da366', '#c73636', '#3b78c9', '#e8a33a', '#9444b0', '#32a89c', '#a83267', '#8a8536'];
        players.forEach((p, idx) => {
            if (idx > 0 && idx % 2 === 0 && gameMode === '1v1') hud.innerHTML += '<div class="hud-vs">VS</div>';
            else if (idx === 1 && gameMode === '1v1') hud.innerHTML += '<div class="hud-vs">VS</div>';
            hud.innerHTML += `<div class="hud-card" id="hud-${idx}" style="border-color: ${teamColors[p.teamId]}"><img src="${p.img.src}" class="hud-img" style="border-color: ${teamColors[p.teamId]}"><div class="hud-bars-container"><div class="hud-name">${p.name}</div><div class="hud-bar"><div class="hud-hp-fill" id="hp-fill-${idx}"></div></div><div class="hud-bar"><div class="hud-skill-fill" id="skill-fill-${idx}"></div></div></div></div>`;
        });
    }

    gameRunning = true; lastTime = performance.now(); requestAnimationFrame(gameLoop);
}

function update(deltaTime) {
    if (!gameRunning) return;
    globalPacingMultiplier += (0.01 * (deltaTime / 1000));
    if (screenShake > 0) screenShake *= 0.9; else screenShake = 0;

    // Sparks
    for (let i = sparks.length - 1; i >= 0; i--) { sparks[i].life -= 0.05; if (sparks[i].life <= 0) sparks.splice(i, 1); else { sparks[i].x += sparks[i].vx; sparks[i].y += sparks[i].vy; } }

    // Blood Splatters Update
    for (let i = bloodSplatters.length - 1; i >= 0; i--) {
        bloodSplatters[i].life -= 0.00015 * deltaTime;
        if (bloodSplatters[i].life <= 0) bloodSplatters.splice(i, 1);
    }

    // Trails Update
    for (let i = trails.length - 1; i >= 0; i--) {
        trails[i].duration -= deltaTime;
        if (trails[i].duration <= 0) trails.splice(i, 1);
    }

    // Floating Texts Update
    for (let i = floatingTexts.length - 1; i >= 0; i--) {
        let ft = floatingTexts[i];
        ft.life -= 0.0012 * deltaTime;
        if (ft.life <= 0) {
            floatingTexts.splice(i, 1);
        } else {
            ft.x += ft.vx;
            ft.y += ft.vy;
            ft.vy += 0.002 * deltaTime;
        }
    }

    players.forEach((p, idx) => {
        p.update(deltaTime);
        let hpFill = document.getElementById(`hp-fill-${idx}`); let skillFill = document.getElementById(`skill-fill-${idx}`);
        if (hpFill) hpFill.style.width = Math.max(0, (p.hp / p.maxHp) * 100) + '%';
        if (skillFill) skillFill.style.width = (p.skillPoints / p.skillConfig.maxHits) * 100 + '%';
        if (p.hp <= 0) document.getElementById(`hud-${idx}`).classList.add('dead');
    });

    // Update Bottom Panel (Player 1 & Player 2 Side-by-Side)
    let statsPanel = document.getElementById('bottom-stats-panel');
    if (statsPanel) {
        if (gameMode === 'br8') {
            statsPanel.style.display = 'none';
        } else {
            statsPanel.style.display = 'flex';
            if (gameMode === '1v1') {
                let p1 = players[0];
                let p2 = players.find(p => p.teamId !== p1.teamId) || players[1];
                if (p1) {
                    document.getElementById('stat-label-0').innerText = "Special Skill P1";
                    document.getElementById('stat-val-0').innerText = p1.skillConfig.name;
                    
                    document.getElementById('stat-label-2').innerText = "Hits To Skill P1";
                    document.getElementById('stat-val-2').innerText = p1.skillActive ? "ACTIVE!" : `${p1.skillPoints} / ${p1.skillConfig.maxHits}`;
                }
                if (p2) {
                    document.getElementById('stat-label-1').innerText = "Special Skill P2";
                    document.getElementById('stat-val-1').innerText = p2.skillConfig.name;
                    
                    document.getElementById('stat-label-3').innerText = "Hits To Skill P2";
                    document.getElementById('stat-val-3').innerText = p2.skillActive ? "ACTIVE!" : `${p2.skillPoints} / ${p2.skillConfig.maxHits}`;
                }
            } else if (gameMode === '2v2') {
                // Show all 4 players' stats in 4 boxes
                for (let idx = 0; idx < 4; idx++) {
                    let p = players[idx];
                    if (p) {
                        document.getElementById(`stat-label-${idx}`).innerText = p.name;
                        document.getElementById(`stat-val-${idx}`).innerText = p.skillActive ? "ACTIVE!" : `${p.skillPoints} / ${p.skillConfig.maxHits}`;
                    }
                }
            }
        }
    }

    // Collision Loops
    for (let i = 0; i < players.length; i++) {
        for (let j = i + 1; j < players.length; j++) {
            let charA = players[i], charB = players[j];
            if (charA.hp <= 0 || charB.hp <= 0) continue;

            // Body Collision
            let dx = charB.x - charA.x, dy = charB.y - charA.y, dist = Math.hypot(dx, dy);
            if (dist < charA.radius + charB.radius) {
                let overlap = (charA.radius + charB.radius) - dist, nx = dx / dist, ny = dy / dist;
                charA.x -= nx * overlap * 0.5; charA.y -= ny * overlap * 0.5; charB.x += nx * overlap * 0.5; charB.y += ny * overlap * 0.5;
                if ((charB.vx - charA.vx) * nx + (charB.vy - charA.vy) * ny < 0) {
                    charA.vx = -nx * 4; charA.vy = -ny * 4; charB.vx = nx * 4; charB.vy = ny * 4; charA.speedMultiplier = 2.0; charB.speedMultiplier = 2.0; playSound('tap');
                }
            }

            // Weapon Hits
            if (charA.teamId !== charB.teamId) {
                let wpA = charA.getWeaponPosition(), distA = Math.hypot(charB.x - wpA.x, charB.y - wpA.y);
                if (distA < charB.radius + charA.weaponRadius && charB.takeDamage(charA, wpA.x, wpA.y)) {
                    playSound(charA.weapon.hitSound); p1Hit(charA);
                }
                let wpB = charB.getWeaponPosition(), distB = Math.hypot(charA.x - wpB.x, charA.y - wpB.y);
                if (distB < charA.radius + charB.weaponRadius && charA.takeDamage(charB, wpB.x, wpB.y)) {
                    playSound(charB.weapon.hitSound); p1Hit(charB);
                }

                // Clone Hits (Japan)
                if (charA.name === "Japan" && charA.skillActive) {
                    charA.clones.forEach(c => {
                        if (Math.hypot(charB.x - c.x, charB.y - c.y) < charB.radius + 20) {
                            // Deal 40% damage manually to avoid recursive complexity or just tweak takeDamage
                            charB.hp -= charA.weapon.damage * 0.4;
                            charB.hitCooldown = 200; charB.flashTimer = 50;
                        }
                    });
                }
                if (charB.name === "Japan" && charB.skillActive) {
                    charB.clones.forEach(c => {
                        if (Math.hypot(charA.x - c.x, charA.y - c.y) < charA.radius + 20) {
                            charA.hp -= charB.weapon.damage * 0.4;
                            charA.hitCooldown = 200; charA.flashTimer = 50;
                        }
                    });
                }

                let distW = Math.hypot(wpB.x - wpA.x, wpB.y - wpA.y);
                if (distW < charA.weaponRadius + charB.weaponRadius && charA.weaponClashCooldown <= 0) {
                    charA.spinDirection *= -1; charB.spinDirection *= -1; charA.weaponClashCooldown = 250; charB.weaponClashCooldown = 250;
                    if (charA.weapon.hitSound === 'batPunch' || charB.weapon.hitSound === 'batPunch') {
                        playSound('batPunch');
                    } else {
                        playSound('clash');
                    }
                    for (let k = 0; k < 5; k++) sparks.push({ x: (wpA.x + wpB.x) / 2, y: (wpA.y + wpB.y) / 2, vx: (Math.random() - 0.5) * 10, vy: (Math.random() - 0.5) * 10, life: 1.0 });
                }
            }
        }
    }

    // Projectiles
    for (let i = bullets.length - 1; i >= 0; i--) {
        let b = bullets[i];
        if (b.homing && b.target && b.target.hp > 0) {
            let dx = b.target.x - b.x, dy = b.target.y - b.y, dist = Math.hypot(dx, dy);
            b.vx = (dx / dist) * 12; b.vy = (dy / dist) * 12;
            b.angle = Math.atan2(b.vy, b.vx);
        }
        if (b.returning) {
            b.returnTimer -= deltaTime;
            if (b.returnTimer <= 0) {
                let dx = b.owner.x - b.x, dy = b.owner.y - b.y, dist = Math.hypot(dx, dy);
                if (dist > 5) {
                    b.vx = (dx / dist) * 12; b.vy = (dy / dist) * 12;
                } else {
                    bullets.splice(i, 1); continue;
                }
            }
        }

        if (b.bounces) {
            b.life -= deltaTime;
            if (b.life <= 0) {
                bullets.splice(i, 1);
                continue;
            }
            if (b.x < 25) { b.x = 25; b.vx = Math.abs(b.vx); playSound('tap'); }
            else if (b.x > 405) { b.x = 405; b.vx = -Math.abs(b.vx); playSound('tap'); }
            if (b.y < 25) { b.y = 25; b.vy = Math.abs(b.vy); playSound('tap'); }
            else if (b.y > 405) { b.y = 405; b.vy = -Math.abs(b.vy); playSound('tap'); }

            if (gameMode === 'br8' && b.x >= 195 && b.x <= 235 && b.y >= 130 && b.y <= 300) {
                let left = Math.abs(b.x - 195);
                let right = Math.abs(b.x - 235);
                let top = Math.abs(b.y - 130);
                let bottom = Math.abs(b.y - 300);
                let minOverlap = Math.min(left, right, top, bottom);
                if (minOverlap === left) { b.x = 195; b.vx = -Math.abs(b.vx); }
                else if (minOverlap === right) { b.x = 235; b.vx = Math.abs(b.vx); }
                else if (minOverlap === top) { b.y = 130; b.vy = -Math.abs(b.vy); }
                else { b.y = 300; b.vy = Math.abs(b.vy); }
                playSound('tap');
            }
        }

        b.x += b.vx * globalPacingMultiplier; b.y += b.vy * globalPacingMultiplier;
        if (!b.bounces && gameMode === 'br8') {
            let minX = 195, maxX = 235, minY = 130, maxY = 300;
            if (b.x >= minX && b.x <= maxX && b.y >= minY && b.y <= maxY) {
                bullets.splice(i, 1);
                continue;
            }
        }
        if (b.x < -100 || b.x > 530 || b.y < -100 || b.y > 530) { bullets.splice(i, 1); continue; }
        
        let hitPlayer = false;
        for (let p of players) {
            if (p.hp > 0 && p.teamId !== b.owner.teamId && Math.hypot(p.x - b.x, p.y - b.y) < p.radius + b.size / 2) {
                if (b.bounces) {
                    if (!b.lastHits) b.lastHits = {};
                    let now = Date.now();
                    if (!b.lastHits[p.name] || now - b.lastHits[p.name] > 500) {
                        b.lastHits[p.name] = now;
                        if (p.takeDamage(b.owner, b.x, b.y, true, b.damage || null)) {
                            playSound(b.owner.weapon.hitSound); p1Hit(b.owner);
                        }
                    }
                } else {
                    if (p.takeDamage(b.owner, b.x, b.y, true, b.damage || null)) {
                        playSound(b.owner.weapon.hitSound); p1Hit(b.owner);
                    }
                    hitPlayer = true;
                }
            }
        }
        if (hitPlayer) { bullets.splice(i, 1); break; }
    }

    // Trails Collision
    for (let t of trails) {
        for (let p of players) {
            if (p.hp > 0 && p.teamId !== t.owner.teamId && Math.hypot(p.x - t.x, p.y - t.y) < p.radius + t.size / 2) {
                let damageAmount = (t.owner.name === "China") ? 1 : null;
                if (p.takeDamage(t.owner, t.x, t.y, true, damageAmount)) {
                    playSound(t.owner.weapon.hitSound);
                    p1Hit(t.owner);
                }
            }
        }
    }

    if (players.filter(p => p.hp > 0).map(p => p.teamId).filter((v, i, a) => a.indexOf(v) === i).length <= 1) { gameRunning = false; setTimeout(showGameOver, 1000); }
}

function p1Hit(attacker) {
    if (attacker.skillActive) return; // Prevent charging skill while active!
    if (attacker.skillPoints < attacker.skillConfig.maxHits) {
        attacker.skillPoints++;
        if (attacker.skillPoints >= attacker.skillConfig.maxHits) attacker.activateSkill();
    }
}

function drawBrWall(ctx) {
    if (gameMode !== 'br8') return;

    ctx.save();
    let grad = ctx.createLinearGradient(195, 130, 235, 300);
    grad.addColorStop(0, '#5d4037');
    grad.addColorStop(0.5, '#8d6e63');
    grad.addColorStop(1, '#4e342e');

    ctx.fillStyle = grad;
    ctx.strokeStyle = '#2d1510';
    ctx.lineWidth = 4;

    ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetX = 4;
    ctx.shadowOffsetY = 4;

    // Draw outer box
    ctx.beginPath();
    ctx.roundRect(195, 130, 40, 170, 4);
    ctx.fill();
    ctx.stroke();

    // Reset shadow for details
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

    // Brick mortar lines (matching realistic brick size ratios)
    ctx.strokeStyle = '#2d1510';
    ctx.lineWidth = 2.5;

    let startY = 130;
    let endY = 300;
    let rowHeight = 14;

    // Draw horizontal mortar lines
    for (let y = startY + rowHeight; y < endY; y += rowHeight) {
        ctx.beginPath();
        ctx.moveTo(195, y);
        ctx.lineTo(235, y);
        ctx.stroke();
    }

    // Draw vertical mortar lines (staggered staggered pattern)
    let rowIndex = 0;
    for (let y = startY; y < endY; y += rowHeight) {
        let nextY = Math.min(y + rowHeight, endY);
        if (rowIndex % 2 === 0) {
            // Even row: vertical mortar joint in the middle
            ctx.beginPath();
            ctx.moveTo(215, y);
            ctx.lineTo(215, nextY);
            ctx.stroke();
        } else {
            // Odd row: two offset vertical mortar joints
            ctx.beginPath();
            ctx.moveTo(205, y);
            ctx.lineTo(205, nextY);
            ctx.moveTo(225, y);
            ctx.lineTo(225, nextY);
            ctx.stroke();
        }
        rowIndex++;
    }
    ctx.restore();
}

function draw() {
    ctx.save();
    if (screenShake > 0) ctx.translate(Math.random() * screenShake - screenShake / 2, Math.random() * screenShake - screenShake / 2);
    ctx.clearRect(0, 0, 430, 430);
    let arenaImg = getImg(gameMode === 'br8' ? 'Asset Battle Royale.png' : 'Asset Arena.png');
    if (arenaImg.complete) ctx.drawImage(arenaImg, 0, 0, 430, 430);

    // Draw Blood Splatters
    bloodSplatters.forEach(b => {
        ctx.save();
        ctx.globalAlpha = b.life;
        ctx.translate(b.x, b.y);
        ctx.rotate(b.angle);
        let img = getImg('Bercak.png');
        if (img.complete) ctx.drawImage(img, -b.size / 2, -b.size / 2, b.size, b.size);
        ctx.restore();
    });

    // Draw Battle Royale Wall
    drawBrWall(ctx);

    trails.forEach(t => { ctx.save(); ctx.globalAlpha = t.duration / t.maxDuration; if (t.img.complete) ctx.drawImage(t.img, t.x - t.size / 2, t.y - t.size / 2, t.size, t.size); ctx.restore(); });
    bullets.forEach(b => { ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(b.angle + Math.PI / 2); if (b.img.complete) ctx.drawImage(b.img, -b.size / 2, -b.size / 2, b.size, b.size); ctx.restore(); });
    sparks.forEach(s => { ctx.fillStyle = `rgba(255, 255, 100, ${s.life})`; ctx.fillRect(s.x, s.y, 4, 4); });
    players.forEach(p => p.draw(ctx));

    // Draw Floating Texts
    floatingTexts.forEach(ft => {
        ctx.save();
        ctx.globalAlpha = ft.life;
        ctx.fillStyle = ft.color;
        ctx.font = 'bold 24px "Fredoka One"';
        ctx.textAlign = 'center';
        ctx.fillText(ft.text, ft.x, ft.y);
        ctx.restore();
    });

    // Draw Pacing Speed Badge
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1.5;
    
    let text = `Pacing: ${globalPacingMultiplier.toFixed(2)}x`;
    ctx.font = 'bold 10px "Fredoka One"';
    let textWidth = ctx.measureText(text).width;
    
    let badgeW = textWidth + 16;
    let badgeH = 18;
    let badgeX = 215 - badgeW / 2;
    let badgeY = 405; // Placed neatly near bottom edge
    
    ctx.beginPath();
    ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 9);
    ctx.fill();
    ctx.stroke();
    
    ctx.fillStyle = '#ffca28'; // Yellow gold accent color
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 215, badgeY + badgeH / 2);
    ctx.restore();

    ctx.restore();
}

function gameLoop(timestamp) { if (!gameRunning) return; let dt = timestamp - lastTime; if (dt > 100) dt = 100; update(dt); draw(); lastTime = timestamp; requestAnimationFrame(gameLoop); }
function showGameOver() {
    gameOverScreen.classList.remove('hidden');
    let alive = players.find(p => p.hp > 0);
    if (!alive) {
        winnerText.innerHTML = "Draw!";
    } else {
        if (gameMode === '2v2') {
            let winningTeamId = alive.teamId;
            let teamName = (winningTeamId === 0) ? "Team A" : "Team B";
            let teamPlayers = players.filter(p => p.teamId === winningTeamId);
            let playerNames = teamPlayers.map(p => p.name).join(" & ");
            winnerText.innerHTML = `${teamName} Wins!<br><span style="font-size: 18px; color: #ffca28; font-family: 'Roboto', sans-serif;">(${playerNames})</span>`;
        } else {
            winnerText.innerHTML = `${alive.name} Wins!`;
        }
    }
}
restartBtn.onclick = () => { gameRunning = false; modeScreen.classList.remove('hidden'); battleScreen.classList.add('hidden'); gameOverScreen.classList.add('hidden'); };

buildCharacterGrid(); buildWeaponGrid();
