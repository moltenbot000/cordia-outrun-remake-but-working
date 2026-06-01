// Google Analytics default capture for this template.
// Future LLM edits: do not remove this gtag setup unless replacing it with equivalent page analytics capture.
const googleAnalyticsId = "G-ZKTPLMMFDQ";
const maxSpeed = 218;
const laneCenters = [-0.62, 0, 0.62];
const carColors = ["#ff3b3b", "#ffd43b", "#3fd5ff", "#8cff5a", "#f65dff"];
function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
}
function wrapOpponent(car, index, distance) {
    const lane = laneCenters[(index + Math.floor(distance / 180)) % laneCenters.length] ?? 0;
    const color = carColors[(index + Math.floor(distance / 260)) % carColors.length] ?? "#ff3b3b";
    return {
        ...car,
        lane,
        color,
        y: -0.34 - index * 0.3,
        passed: false,
    };
}
export function createInitialRaceState() {
    return {
        speed: 0,
        distance: 0,
        damage: 0,
        position: 0,
        score: 0,
        time: 0,
        curve: 0,
        collisionCooldown: 0,
        opponents: [
            { id: 1, lane: -0.62, y: -0.2, color: "#ff3b3b", passed: false },
            { id: 2, lane: 0.62, y: -0.58, color: "#ffd43b", passed: false },
            { id: 3, lane: 0, y: -0.94, color: "#3fd5ff", passed: false },
        ],
    };
}
export function stepRace(state, input, deltaSeconds) {
    const dt = clamp(deltaSeconds, 0, 0.05);
    const acceleration = input.accelerate ? 120 : -28;
    const braking = input.brake ? 170 : 0;
    const damageDrag = state.damage * 0.55;
    const speed = clamp(state.speed + (acceleration - braking - damageDrag) * dt, 0, maxSpeed);
    const steer = (input.right ? 1 : 0) - (input.left ? 1 : 0);
    const position = clamp(state.position + steer * (0.95 + speed / maxSpeed) * dt, -1, 1);
    const distance = state.distance + speed * dt * 0.42;
    const curve = Math.sin(distance / 150) * 0.38 + Math.sin(distance / 410) * 0.2;
    let damage = state.damage;
    let score = state.score + Math.floor(speed * dt * 4);
    let collisionCooldown = Math.max(0, state.collisionCooldown - dt);
    const opponents = state.opponents.map((car, index) => {
        let nextCar = {
            ...car,
            y: car.y + (0.12 + speed / 260) * dt,
        };
        if (!nextCar.passed && nextCar.y > 1.05) {
            nextCar = { ...nextCar, passed: true };
            score += 350;
        }
        if (nextCar.y > 1.25) {
            return wrapOpponent(nextCar, index, distance);
        }
        if (collisionCooldown === 0 &&
            nextCar.y > 0.76 &&
            nextCar.y < 0.98 &&
            Math.abs(nextCar.lane - position) < 0.32) {
            damage = clamp(damage + 18, 0, 100);
            collisionCooldown = 0.8;
            score = Math.max(0, score - 250);
        }
        return nextCar;
    });
    return {
        speed,
        distance,
        damage,
        position,
        score,
        time: state.time + dt,
        curve,
        collisionCooldown,
        opponents,
    };
}
function initializeGoogleAnalytics() {
    const googleTagScript = document.createElement("script");
    googleTagScript.async = true;
    googleTagScript.src = `https://www.googletagmanager.com/gtag/js?id=${googleAnalyticsId}`;
    document.head.append(googleTagScript);
    window.dataLayer = window.dataLayer || [];
    window.gtag = function gtag() {
        window.dataLayer?.push(arguments);
    };
    window.gtag("js", new Date());
    window.gtag("config", googleAnalyticsId);
}
function getElement(selector, type) {
    const element = document.querySelector(selector);
    if (!(element instanceof type)) {
        throw new Error(`Missing required element: ${selector}`);
    }
    return element;
}
function getElements() {
    return {
        gameShell: getElement("#game", HTMLElement),
        canvas: getElement("#race-canvas", HTMLCanvasElement),
        screenLayer: getElement("#screen-layer", HTMLElement),
        menuScreen: getElement("#menu-screen", HTMLElement),
        driverForm: getElement("#driver-form", HTMLFormElement),
        driverNameInput: getElement("#driver-name", HTMLInputElement),
        countdownScreen: getElement("#countdown-screen", HTMLElement),
        countdownValue: getElement("#countdown-value", HTMLElement),
        playNowButton: getElement("#play-now", HTMLButtonElement),
        speedValue: getElement("#speed-value", HTMLElement),
        damageValue: getElement("#damage-value", HTMLElement),
        distanceValue: getElement("#distance-value", HTMLElement),
        positionValue: getElement("#position-value", HTMLElement),
        scoreValue: getElement("#score-value", HTMLElement),
        startButton: getElement("#start-race", HTMLButtonElement),
        pauseButton: getElement("#pause-race", HTMLButtonElement),
        fullScreenButton: getElement("#full-screen", HTMLButtonElement),
        statusText: getElement("#status-text", HTMLElement),
        touchButtons: Array.from(document.querySelectorAll("[data-touch-key]")),
    };
}
function drawCar(context, x, y, width, height, color) {
    context.fillStyle = "#111827";
    context.fillRect(x - width * 0.47, y + height * 0.28, width * 0.94, height * 0.2);
    context.fillStyle = color;
    context.beginPath();
    context.moveTo(x - width * 0.5, y + height * 0.36);
    context.lineTo(x - width * 0.35, y - height * 0.36);
    context.lineTo(x + width * 0.35, y - height * 0.36);
    context.lineTo(x + width * 0.5, y + height * 0.36);
    context.closePath();
    context.fill();
    context.fillStyle = "#bff3ff";
    context.fillRect(x - width * 0.23, y - height * 0.2, width * 0.46, height * 0.22);
    context.fillStyle = "#fff7a6";
    context.fillRect(x - width * 0.34, y + height * 0.15, width * 0.15, height * 0.09);
    context.fillRect(x + width * 0.19, y + height * 0.15, width * 0.15, height * 0.09);
}
function drawPalmTree(context, x, y, size) {
    const trunkHeight = size * 4.2;
    const trunkWidth = Math.max(3, size * 0.32);
    context.save();
    context.translate(x, y);
    context.rotate(Math.sin(x) * 0.08);
    context.strokeStyle = "#5b2a42";
    context.lineWidth = trunkWidth;
    context.beginPath();
    context.moveTo(0, 0);
    context.quadraticCurveTo(size * 0.18, -trunkHeight * 0.48, size * 0.08, -trunkHeight);
    context.stroke();
    context.strokeStyle = "#1ef6a7";
    context.lineWidth = Math.max(2, size * 0.18);
    for (let index = 0; index < 6; index += 1) {
        const angle = -Math.PI * 0.92 + index * (Math.PI / 5);
        context.beginPath();
        context.moveTo(size * 0.08, -trunkHeight);
        context.quadraticCurveTo(Math.cos(angle) * size * 1.55, -trunkHeight + Math.sin(angle) * size * 0.55, Math.cos(angle) * size * 2.65, -trunkHeight + Math.sin(angle) * size * 1.05);
        context.stroke();
    }
    context.restore();
}
function drawRock(context, x, y, size) {
    context.fillStyle = "#5c2f67";
    context.beginPath();
    context.moveTo(x - size * 1.4, y);
    context.lineTo(x - size * 0.72, y - size * 0.88);
    context.lineTo(x + size * 0.18, y - size * 1.16);
    context.lineTo(x + size * 1.25, y - size * 0.42);
    context.lineTo(x + size * 1.55, y);
    context.closePath();
    context.fill();
    context.fillStyle = "rgb(255 244 166 / 28%)";
    context.beginPath();
    context.moveTo(x - size * 0.56, y - size * 0.72);
    context.lineTo(x + size * 0.12, y - size * 1.02);
    context.lineTo(x + size * 0.58, y - size * 0.52);
    context.closePath();
    context.fill();
}
function drawLandmarks(context, width, horizon, roadBottom, center, curveShift, distance) {
    const landmarkCount = 18;
    for (let index = 0; index < landmarkCount; index += 1) {
        const progress = (distance / 54 + index / landmarkCount) % 1;
        const perspective = progress * progress;
        const y = horizon + (roadBottom - horizon) * perspective;
        const side = index % 2 === 0 ? -1 : 1;
        const topEdge = center + side * width * 0.08 + curveShift * 0.25;
        const bottomEdge = width * (side < 0 ? 0.1 : 0.9) - curveShift;
        const roadEdge = topEdge + (bottomEdge - topEdge) * perspective;
        const roadsideOffset = width * (0.07 + perspective * 0.12);
        const wobble = Math.sin(index * 12.989 + distance * 0.018) * width * 0.025 * perspective;
        const x = roadEdge + side * roadsideOffset + wobble;
        const size = width * (0.007 + perspective * 0.044);
        context.fillStyle = "rgb(20 11 36 / 34%)";
        context.beginPath();
        context.ellipse(x + side * size * 0.7, y + size * 0.1, size * 1.8, size * 0.45, 0, 0, Math.PI * 2);
        context.fill();
        if (index % 3 === 1) {
            drawRock(context, x, y, size * 1.35);
        }
        else {
            drawPalmTree(context, x, y, size);
        }
    }
}
function renderRace(context, canvas, state) {
    const width = canvas.width;
    const height = canvas.height;
    const horizon = height * 0.38;
    const roadBottom = height * 0.98;
    const center = width * 0.5;
    const curveShift = state.curve * width * 0.12;
    context.clearRect(0, 0, width, height);
    const skyGradient = context.createLinearGradient(0, 0, 0, horizon);
    skyGradient.addColorStop(0, "#12002b");
    skyGradient.addColorStop(0.5, "#ff3a88");
    skyGradient.addColorStop(1, "#ffb443");
    context.fillStyle = skyGradient;
    context.fillRect(0, 0, width, horizon);
    context.fillStyle = "#ffe45e";
    context.beginPath();
    context.arc(center + width * 0.22, horizon * 0.72, width * 0.09, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = "#241047";
    context.beginPath();
    context.moveTo(0, horizon);
    context.lineTo(width * 0.18, horizon * 0.62);
    context.lineTo(width * 0.38, horizon);
    context.lineTo(width * 0.56, horizon * 0.58);
    context.lineTo(width * 0.78, horizon);
    context.lineTo(width, horizon * 0.68);
    context.lineTo(width, horizon);
    context.closePath();
    context.fill();
    context.fillStyle = "#e85b9a";
    context.fillRect(0, horizon, width, height - horizon);
    drawLandmarks(context, width, horizon, roadBottom, center, curveShift, state.distance);
    context.fillStyle = "#1c1b28";
    context.beginPath();
    context.moveTo(center - width * 0.08 + curveShift * 0.25, horizon);
    context.lineTo(center + width * 0.08 + curveShift * 0.25, horizon);
    context.lineTo(width * 0.9 - curveShift, roadBottom);
    context.lineTo(width * 0.1 - curveShift, roadBottom);
    context.closePath();
    context.fill();
    context.strokeStyle = "#fff7a6";
    context.lineWidth = Math.max(2, width * 0.006);
    context.setLineDash([height * 0.05, height * 0.04]);
    [-0.32, 0.32].forEach((laneOffset) => {
        context.beginPath();
        context.moveTo(center + laneOffset * width * 0.08 + curveShift * 0.25, horizon);
        context.lineTo(center + laneOffset * width * 0.78 - curveShift, roadBottom);
        context.stroke();
    });
    context.setLineDash([]);
    context.strokeStyle = "#43f5ff";
    context.lineWidth = Math.max(4, width * 0.011);
    context.beginPath();
    context.moveTo(center - width * 0.08 + curveShift * 0.25, horizon);
    context.lineTo(width * 0.1 - curveShift, roadBottom);
    context.stroke();
    context.beginPath();
    context.moveTo(center + width * 0.08 + curveShift * 0.25, horizon);
    context.lineTo(width * 0.9 - curveShift, roadBottom);
    context.stroke();
    state.opponents
        .filter((car) => car.y > -0.1 && car.y < 1.12)
        .sort((a, b) => a.y - b.y)
        .forEach((car) => {
        const perspective = car.y * car.y;
        const roadWidth = width * (0.08 + perspective * 0.78);
        const y = horizon + (roadBottom - horizon) * perspective;
        const x = center + curveShift * (1 - car.y) + car.lane * roadWidth * 0.42 - state.curve * width * 0.11;
        const carWidth = width * (0.035 + perspective * 0.09);
        drawCar(context, x, y, carWidth, carWidth * 1.55, car.color);
    });
    drawCar(context, center + state.position * width * 0.26, height * 0.83, width * 0.17, width * 0.18, "#24f0ff");
}
function initializeApp() {
    initializeGoogleAnalytics();
    const elements = getElements();
    const context = elements.canvas.getContext("2d");
    if (!context) {
        throw new Error("Canvas rendering context unavailable");
    }
    const renderingContext = context;
    const input = { left: false, right: false, accelerate: false, brake: false };
    let state = createInitialRaceState();
    let phase = "menu";
    let driverName = "";
    let countdownTimer;
    let fullScreenActive = false;
    let lastFrame = performance.now();
    function clearInput() {
        input.left = false;
        input.right = false;
        input.accelerate = false;
        input.brake = false;
    }
    function showScreen(screen) {
        elements.menuScreen.hidden = screen !== "menu";
        elements.driverForm.hidden = screen !== "name";
        elements.countdownScreen.hidden = screen !== "countdown";
        elements.screenLayer.hidden = screen === "race";
    }
    function clearCountdown() {
        if (countdownTimer !== undefined) {
            window.clearInterval(countdownTimer);
            countdownTimer = undefined;
        }
    }
    function goToMenu() {
        clearCountdown();
        clearInput();
        state = createInitialRaceState();
        phase = "menu";
        elements.startButton.textContent = "Play Now";
        elements.pauseButton.textContent = "Pause";
        showScreen("menu");
    }
    function goToNameEntry() {
        clearCountdown();
        clearInput();
        phase = "name";
        elements.startButton.textContent = "Play Now";
        elements.pauseButton.textContent = "Pause";
        showScreen("name");
        elements.driverNameInput.focus();
    }
    function beginCountdown() {
        clearCountdown();
        clearInput();
        state = createInitialRaceState();
        phase = "countdown";
        let count = 3;
        elements.countdownValue.textContent = String(count);
        elements.startButton.textContent = "Restart";
        elements.pauseButton.textContent = "Pause";
        showScreen("countdown");
        countdownTimer = window.setInterval(() => {
            count -= 1;
            if (count > 0) {
                elements.countdownValue.textContent = String(count);
                return;
            }
            clearCountdown();
            phase = "racing";
            lastFrame = performance.now();
            showScreen("race");
        }, 1000);
    }
    function resizeCanvas() {
        const ratio = window.devicePixelRatio || 1;
        const { width, height } = elements.canvas.getBoundingClientRect();
        elements.canvas.width = Math.floor(width * ratio);
        elements.canvas.height = Math.floor(height * ratio);
        renderingContext.setTransform(1, 0, 0, 1, 0, 0);
        renderRace(renderingContext, elements.canvas, state);
    }
    function setInput(key, value) {
        const keyMap = {
            ArrowLeft: "left",
            a: "left",
            A: "left",
            ArrowRight: "right",
            d: "right",
            D: "right",
            ArrowUp: "accelerate",
            w: "accelerate",
            W: "accelerate",
            ArrowDown: "brake",
            s: "brake",
            S: "brake",
            " ": "accelerate",
        };
        const inputKey = keyMap[key];
        if (inputKey) {
            input[inputKey] = value;
        }
    }
    function updateFullScreenState(active) {
        fullScreenActive = active;
        elements.gameShell.classList.toggle("is-fullscreen", active);
        elements.fullScreenButton.setAttribute("aria-pressed", String(active));
        elements.fullScreenButton.textContent = active ? "Exit Full" : "Full Screen";
        resizeCanvas();
    }
    async function toggleFullScreen() {
        const nextActive = !fullScreenActive;
        updateFullScreenState(nextActive);
        if (!document.fullscreenEnabled) {
            return;
        }
        try {
            if (nextActive && !document.fullscreenElement) {
                await elements.gameShell.requestFullscreen();
            }
            else if (!nextActive && document.fullscreenElement) {
                await document.exitFullscreen();
            }
        }
        catch {
            updateFullScreenState(nextActive);
        }
    }
    function renderStats() {
        elements.speedValue.textContent = `${Math.round(state.speed)} mph`;
        elements.damageValue.textContent = `${Math.round(state.damage)}%`;
        elements.distanceValue.textContent = `${(state.distance / 1000).toFixed(2)} mi`;
        elements.positionValue.textContent =
            state.damage >= 100
                ? "Wrecked"
                : phase === "racing"
                    ? driverName
                        ? `${driverName} Racing`
                        : "Racing"
                    : phase === "paused"
                        ? "Paused"
                        : phase === "countdown"
                            ? "Ready"
                            : "Menu";
        elements.scoreValue.textContent = String(state.score).padStart(5, "0");
        elements.statusText.textContent =
            state.damage >= 100
                ? "Race over. Restart to run again."
                : phase === "racing"
                    ? "Arrow keys or WASD."
                    : phase === "paused"
                        ? "Paused."
                        : phase === "countdown"
                            ? "Race starts after countdown."
                            : "Click Play Now.";
    }
    function frame(now) {
        const deltaSeconds = (now - lastFrame) / 1000;
        lastFrame = now;
        if (phase === "racing" && state.damage < 100) {
            state = stepRace(state, input, deltaSeconds);
        }
        if (state.damage >= 100 && phase === "racing") {
            phase = "paused";
            clearInput();
        }
        renderRace(renderingContext, elements.canvas, state);
        renderStats();
        requestAnimationFrame(frame);
    }
    elements.startButton.addEventListener("click", () => {
        if (phase === "menu" || phase === "name") {
            goToNameEntry();
            return;
        }
        beginCountdown();
    });
    elements.playNowButton.addEventListener("click", goToNameEntry);
    elements.driverForm.addEventListener("submit", (event) => {
        event.preventDefault();
        const name = elements.driverNameInput.value.trim();
        if (!name) {
            elements.driverNameInput.focus();
            return;
        }
        driverName = name;
        beginCountdown();
    });
    elements.pauseButton.addEventListener("click", () => {
        if (phase === "racing") {
            phase = "paused";
            clearInput();
            elements.pauseButton.textContent = "Resume";
            return;
        }
        if (phase === "paused" && state.damage < 100) {
            phase = "racing";
            lastFrame = performance.now();
            elements.pauseButton.textContent = "Pause";
        }
    });
    elements.fullScreenButton.addEventListener("click", () => {
        void toggleFullScreen();
    });
    document.addEventListener("fullscreenchange", () => {
        updateFullScreenState(document.fullscreenElement === elements.gameShell);
    });
    elements.touchButtons.forEach((button) => {
        const inputKey = button.dataset.touchKey;
        if (!inputKey) {
            return;
        }
        const setTouchInput = (value) => {
            input[inputKey] = value;
        };
        button.addEventListener("pointerdown", (event) => {
            event.preventDefault();
            button.setPointerCapture(event.pointerId);
            setTouchInput(true);
        });
        button.addEventListener("pointerup", () => setTouchInput(false));
        button.addEventListener("pointercancel", () => setTouchInput(false));
        button.addEventListener("lostpointercapture", () => setTouchInput(false));
    });
    window.addEventListener("keydown", (event) => {
        if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", " "].includes(event.key)) {
            event.preventDefault();
        }
        setInput(event.key, true);
    });
    window.addEventListener("keyup", (event) => setInput(event.key, false));
    window.addEventListener("resize", resizeCanvas);
    resizeCanvas();
    goToMenu();
    renderStats();
    requestAnimationFrame(frame);
}
if (typeof document !== "undefined") {
    initializeApp();
}
