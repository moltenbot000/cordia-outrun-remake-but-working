// Google Analytics default capture for this template.
// Future LLM edits: do not remove this gtag setup unless replacing it with equivalent page analytics capture.
const googleAnalyticsId = "G-ZKTPLMMFDQ";
const countdownSteps = ["3", "2", "1"] as const;

type Screen = "menu" | "name" | "countdown" | "race";

interface RaceState {
  screen: Screen;
  playerName: string;
  countdownIndex: number;
}

interface AppElements {
  countdownNumber: HTMLElement;
  countdownScreen: HTMLElement;
  menuScreen: HTMLElement;
  nameError: HTMLElement;
  nameForm: HTMLFormElement;
  nameInput: HTMLInputElement;
  nameScreen: HTMLElement;
  playButton: HTMLButtonElement;
  raceCar: HTMLElement;
  raceScreen: HTMLElement;
  racerName: HTMLElement;
  restartButton: HTMLButtonElement;
  title: HTMLHeadingElement;
}

declare global {
  interface Window {
    dataLayer?: IArguments[];
    gtag?: (...args: unknown[]) => void;
  }
}

export function normalizePlayerName(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

export function getCountdownValue(index: number): string {
  return countdownSteps[index] ?? "GO";
}

export function createInitialState(): RaceState {
  return {
    screen: "menu",
    playerName: "",
    countdownIndex: 0,
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

function getElement<T extends Element>(selector: string, type: { new (): T }): T {
  const element = document.querySelector(selector);
  if (!(element instanceof type)) {
    throw new Error(`Missing required element: ${selector}`);
  }
  return element;
}

function getElements(): AppElements {
  return {
    countdownNumber: getElement("#countdown-number", HTMLElement),
    countdownScreen: getElement("#countdown-screen", HTMLElement),
    menuScreen: getElement("#menu-screen", HTMLElement),
    nameError: getElement("#name-error", HTMLElement),
    nameForm: getElement("#name-form", HTMLFormElement),
    nameInput: getElement("#player-name", HTMLInputElement),
    nameScreen: getElement("#name-screen", HTMLElement),
    playButton: getElement("#play-now", HTMLButtonElement),
    raceCar: getElement("#race-car", HTMLElement),
    raceScreen: getElement("#race-screen", HTMLElement),
    racerName: getElement("#racer-name", HTMLElement),
    restartButton: getElement("#restart-race", HTMLButtonElement),
    title: getElement(".topbar h1", HTMLHeadingElement),
  };
}

function initializeApp() {
  initializeGoogleAnalytics();

  const elements = getElements();
  let state = createInitialState();
  let countdownTimer: number | undefined;

  function setScreen(screen: Screen) {
    state = { ...state, screen };
    render();
  }

  function stopCountdown() {
    window.clearTimeout(countdownTimer);
    countdownTimer = undefined;
  }

  function startCountdown() {
    stopCountdown();
    state = { ...state, screen: "countdown", countdownIndex: 0 };
    render();

    countdownTimer = window.setInterval(() => {
      const nextIndex = state.countdownIndex + 1;
      if (nextIndex >= countdownSteps.length) {
        stopCountdown();
        setScreen("race");
        return;
      }

      state = { ...state, countdownIndex: nextIndex };
      render();
    }, 1000);
  }

  function render() {
    const screens = [
      elements.menuScreen,
      elements.nameScreen,
      elements.countdownScreen,
      elements.raceScreen,
    ];

    screens.forEach((screen) => {
      screen.hidden = screen.dataset.screen !== state.screen;
    });

    document.title = state.screen === "race" ? `${state.playerName} Racing` : "Nitro Rush";
    elements.title.textContent = "Nitro Rush";
    elements.countdownNumber.textContent = getCountdownValue(state.countdownIndex);
    elements.racerName.textContent = state.playerName;
    elements.raceCar.classList.toggle("is-racing", state.screen === "race");

    if (state.screen === "name") {
      elements.nameInput.focus();
    }
  }

  elements.playButton.addEventListener("click", () => {
    setScreen("name");
  });

  elements.nameForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const playerName = normalizePlayerName(elements.nameInput.value);
    if (!playerName) {
      elements.nameError.textContent = "Enter racer name.";
      elements.nameInput.focus();
      return;
    }

    elements.nameError.textContent = "";
    state = { ...state, playerName };
    startCountdown();
  });

  elements.restartButton.addEventListener("click", () => {
    stopCountdown();
    state = createInitialState();
    elements.nameInput.value = "";
    elements.nameError.textContent = "";
    render();
  });

  render();
}

if (typeof document !== "undefined") {
  initializeApp();
}
