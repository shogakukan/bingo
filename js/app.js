(function () {
  "use strict";

  const STORAGE_KEY = "bingoCard";
  const EXPIRY_MS = 48 * 60 * 60 * 1000; // 48 hours
  const DESKTOP_SLOTS = ["p1", "p2", "p3", "p4", "p5", "p6", "p7", "p8", "p9", "p10", "p11", "p12"];
  const GRID_SIZE = DESKTOP_SLOTS.length;
  const GAP = 8; // px, same for rows and columns, always
  const DESKTOP_BREAKPOINT = "(min-width: 700px)";

  const gridWrapperEl = document.getElementById("grid-wrapper");
  const gridEl = document.getElementById("bingo-grid");
  const resetBtn = document.getElementById("reset-btn");
  const storageWarning = document.getElementById("storage-warning");
  const confirmOverlay = document.getElementById("confirm-overlay");
  const confirmAccept = document.getElementById("confirm-accept");
  const confirmCancel = document.getElementById("confirm-cancel");

  let storageAvailable = true;
  let state = null; // { carton: string[], marcadas: boolean[], creadoEn: number }

  function isStorageAvailable() {
    try {
      const testKey = "__bingo_test__";
      window.localStorage.setItem(testKey, "1");
      window.localStorage.removeItem(testKey);
      return true;
    } catch (e) {
      return false;
    }
  }

  function loadState() {
    if (!storageAvailable) return null;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (
        !parsed ||
        !Array.isArray(parsed.carton) ||
        !Array.isArray(parsed.marcadas) ||
        typeof parsed.creadoEn !== "number" ||
        parsed.carton.length !== GRID_SIZE ||
        parsed.marcadas.length !== GRID_SIZE
      ) {
        return null;
      }
      const age = Date.now() - parsed.creadoEn;
      if (age < 0 || age > EXPIRY_MS) {
        return null; // expired or invalid timestamp
      }
      return parsed;
    } catch (e) {
      return null;
    }
  }

  function saveState() {
    if (!storageAvailable) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      // Storage failed mid-session (quota, private mode edge cases). App keeps
      // working in-memory; just stop trying to persist further.
      storageAvailable = false;
      showStorageWarning();
    }
  }

  function clearState() {
    if (!storageAvailable) return;
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      // ignore
    }
  }

  function showStorageWarning() {
    if (storageWarning) {
      storageWarning.hidden = false;
    }
  }

  function shuffle(array) {
    const arr = array.slice();
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  function generateCard() {
    if (typeof BINGO_OPTIONS === "undefined" || BINGO_OPTIONS.length < GRID_SIZE) {
      throw new Error(
        `BINGO_OPTIONS needs at least ${GRID_SIZE} items (found ${
          typeof BINGO_OPTIONS === "undefined" ? 0 : BINGO_OPTIONS.length
        }). Edit js/options.js.`
      );
    }
    const carton = shuffle(BINGO_OPTIONS).slice(0, GRID_SIZE);
    return {
      carton,
      marcadas: new Array(GRID_SIZE).fill(false),
      creadoEn: Date.now(),
    };
  }

  function render() {
    gridEl.innerHTML = "";

    const heading = document.createElement("div");
    heading.className = "grid-heading";
    const title = document.createElement("h1");
    heading.appendChild(title);
    const selected = state.marcadas.filter(c => c === true).length;
    if (GRID_SIZE !== selected) {
      title.textContent = "El bingo de Tierra X";
      const subtitle = document.createElement("p");
      subtitle.className = "subtitle";
      subtitle.textContent = `Aciertos ${selected} / ${GRID_SIZE}`;
      heading.appendChild(subtitle);
      heading.classList.remove("winner");
    } else {
      title.textContent = "Ganaste el bingo de Tierra X";
      heading.classList.add("winner");
    }
    gridEl.appendChild(heading);

    state.carton.forEach((text, index) => {
      const cell = document.createElement("button");
      cell.type = "button";
      cell.className = "cell" + (state.marcadas[index] ? " marked" : "");
      cell.setAttribute("aria-pressed", String(state.marcadas[index]));
      cell.style.setProperty("--slot", DESKTOP_SLOTS[index]);

      const label = document.createElement("span");
      label.className = "cell-text";
      label.textContent = text;
      cell.appendChild(label);

      const check = document.createElement("span");
      check.className = "cell-check";
      check.setAttribute("aria-hidden", "true");
      check.textContent = "✓";
      cell.appendChild(check);

      cell.addEventListener("click", () => toggleCell(index));
      gridEl.appendChild(cell);
    });

    layoutGrid();
  }

  function layoutGrid() {
    const isDesktop = window.matchMedia(DESKTOP_BREAKPOINT).matches;
    // Desktop: heading overlaps a 2x2 block inside a 4x4 grid (4 rows).
    // Mobile: heading is its own full-width row on top of 4 rows of 3 cells (5 rows).
    const cols = isDesktop ? 4 : 3;
    const rows = isDesktop ? 4 : 5;

    const availW = gridWrapperEl.clientWidth;
    const availH = gridWrapperEl.clientHeight;

    const cellByWidth = (availW - GAP * (cols - 1)) / cols;
    const cellByHeight = (availH - GAP * (rows - 1)) / rows;
    const cellSize = Math.max(0, Math.floor(Math.min(cellByWidth, cellByHeight)));

    const totalW = cellSize * cols + GAP * (cols - 1);
    const totalH = cellSize * rows + GAP * (rows - 1);

    gridEl.style.gap = GAP + "px";
    gridEl.style.width = totalW + "px";
    gridEl.style.height = totalH + "px";
    gridEl.style.setProperty("--cell-size", cellSize + "px");
  }

  function toggleCell(index) {
    state.marcadas[index] = !state.marcadas[index];
    saveState();
    render();
  }

  function newCard() {
    state = generateCard();
    saveState();
    render();
  }

  function openConfirm() {
    confirmOverlay.hidden = false;
    confirmAccept.focus();
  }

  function closeConfirm() {
    confirmOverlay.hidden = true;
    resetBtn.focus();
  }

  function init() {
    storageAvailable = isStorageAvailable();
    if (!storageAvailable) {
      showStorageWarning();
    }

    const loaded = loadState();
    state = loaded || generateCard();
    if (!loaded) saveState();

    render();

    resetBtn.addEventListener("click", openConfirm);

    confirmAccept.addEventListener("click", () => {
      closeConfirm();
      clearState();
      newCard();
    });

    confirmCancel.addEventListener("click", closeConfirm);

    confirmOverlay.addEventListener("click", (event) => {
      if (event.target === confirmOverlay) closeConfirm();
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && !confirmOverlay.hidden) closeConfirm();
    });

    let resizeFrame = null;
    window.addEventListener("resize", () => {
      if (resizeFrame) return;
      resizeFrame = requestAnimationFrame(() => {
        resizeFrame = null;
        layoutGrid();
      });
    });
  }

  init();
})();
