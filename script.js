
(() => {
  const ACCESS_CODE = "011026";

  const stages = [...document.querySelectorAll(".stage")];
  const screens = [...document.querySelectorAll(".screen")];

  const envelopeBtn = document.getElementById("envelopeBtn");
  const soundToggle = document.getElementById("soundToggle");
  const passwordForm = document.getElementById("passwordForm");
  const passwordInput = document.getElementById("passwordInput");
  const passwordFeedback = document.getElementById("passwordFeedback");
  const showPasswordBtn = document.getElementById("showPasswordBtn");
  const folderBtn = document.getElementById("folderBtn");

  const beginBtn = document.getElementById("beginBtn");
  const subjectCards = [...document.querySelectorAll(".subject-card")];
  const progressText = document.getElementById("progressText");
  const questionPanel = document.getElementById("questionPanel");
  const quizForm = document.getElementById("quizForm");
  const feedback = document.getElementById("feedback");
  const archiveBtn = document.getElementById("archiveBtn");

  const revealed = new Set();

  let audioCtx = null;
  let masterGain = null;
  let drone1 = null;
  let drone2 = null;
  let lfo = null;
  let soundOn = false;

  function showStage(id) {
    stages.forEach(stage => stage.classList.toggle("active", stage.id === id));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function showScreen(id) {
    screens.forEach(screen => screen.classList.toggle("active", screen.id === id));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function startSound() {
    if (soundOn) return;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) {
      soundToggle.textContent = "♪ SOUND UNAVAILABLE";
      soundToggle.disabled = true;
      return;
    }

    audioCtx = audioCtx || new AudioContext();
    if (audioCtx.state === "suspended") audioCtx.resume();

    masterGain = audioCtx.createGain();
    masterGain.gain.setValueAtTime(0.0001, audioCtx.currentTime);
    masterGain.gain.exponentialRampToValueAtTime(0.055, audioCtx.currentTime + 1.2);
    masterGain.connect(audioCtx.destination);

    const lowpass = audioCtx.createBiquadFilter();
    lowpass.type = "lowpass";
    lowpass.frequency.value = 520;
    lowpass.Q.value = 0.7;
    lowpass.connect(masterGain);

    drone1 = audioCtx.createOscillator();
    drone1.type = "sine";
    drone1.frequency.value = 55;

    drone2 = audioCtx.createOscillator();
    drone2.type = "triangle";
    drone2.frequency.value = 82.41;

    const gain1 = audioCtx.createGain();
    gain1.gain.value = 0.7;
    const gain2 = audioCtx.createGain();
    gain2.gain.value = 0.18;

    drone1.connect(gain1).connect(lowpass);
    drone2.connect(gain2).connect(lowpass);

    lfo = audioCtx.createOscillator();
    const lfoGain = audioCtx.createGain();
    lfo.type = "sine";
    lfo.frequency.value = 0.09;
    lfoGain.gain.value = 7;
    lfo.connect(lfoGain).connect(drone2.frequency);

    drone1.start();
    drone2.start();
    lfo.start();

    soundOn = true;
    soundToggle.setAttribute("aria-pressed", "true");
    soundToggle.textContent = "♪ SOUND: ON";
  }

  function stopSound() {
    if (!soundOn || !audioCtx || !masterGain) return;
    const now = audioCtx.currentTime;
    masterGain.gain.cancelScheduledValues(now);
    masterGain.gain.setValueAtTime(Math.max(masterGain.gain.value, 0.0001), now);
    masterGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.5);

    setTimeout(() => {
      [drone1, drone2, lfo].forEach(node => {
        try { node && node.stop(); } catch (_) {}
      });
    }, 600);

    soundOn = false;
    soundToggle.setAttribute("aria-pressed", "false");
    soundToggle.textContent = "♪ SOUND: OFF";
  }

  soundToggle.addEventListener("click", () => {
    if (soundOn) stopSound();
    else startSound();
  });

  envelopeBtn.addEventListener("click", () => {
    if (!soundOn) startSound();
    showStage("passwordStage");
    setTimeout(() => passwordInput.focus(), 350);
  });

  showPasswordBtn.addEventListener("click", () => {
    const showing = passwordInput.type === "text";
    passwordInput.type = showing ? "password" : "text";
    showPasswordBtn.textContent = showing ? "SHOW" : "HIDE";
  });

  passwordForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const value = passwordInput.value.trim();

    if (value === ACCESS_CODE) {
      passwordFeedback.textContent = "ACCESS GRANTED.";
      passwordFeedback.className = "password-feedback ok";
      passwordInput.disabled = true;
      passwordForm.querySelector('button[type="submit"]').disabled = true;
      setTimeout(() => showStage("revealStage"), 700);
    } else {
      passwordFeedback.textContent = "ACCESS DENIED. Check the date.";
      passwordFeedback.className = "password-feedback error";
      passwordInput.select();
    }
  });

  folderBtn.addEventListener("click", () => {
    showStage("caseStage");
    showScreen("cover");
  });

  beginBtn.addEventListener("click", () => showScreen("evidence"));

  subjectCards.forEach(card => {
    card.addEventListener("click", () => {
      const id = card.dataset.subject;
      if (!revealed.has(id)) {
        revealed.add(id);
        card.classList.add("revealed");
        card.setAttribute("aria-expanded", "true");
        const status = card.querySelector(".subject-status");
        if (status) status.textContent = "REVEALED";
      }

      progressText.textContent = `${revealed.size} / 3 evidence files reviewed`;

      if (revealed.size === subjectCards.length) {
        questionPanel.classList.remove("hidden");
        progressText.textContent = "All evidence reviewed. Assessment unlocked.";
        setTimeout(() => questionPanel.scrollIntoView({ behavior: "smooth", block: "start" }), 250);
      }
    });
  });

  quizForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const selected = quizForm.querySelector('input[name="answer"]:checked');

    if (!selected) {
      feedback.textContent = "Select an answer before submitting.";
      feedback.className = "feedback bad";
      return;
    }

    if (selected.value === "C") {
      feedback.textContent = "Correct. Assessment complete. Opening result…";
      feedback.className = "feedback good";
      quizForm.querySelectorAll("input,button").forEach(el => el.disabled = true);
      setTimeout(() => showScreen("result"), 700);
    } else {
      const hints = {
        A: "Surface judgment detected. Look beneath the label.",
        B: "No. The behaviour is not random. Ask what it may be protecting.",
        D: "That describes the outcome, not the mechanism beneath it."
      };
      feedback.textContent = hints[selected.value] || "Reassess the evidence.";
      feedback.className = "feedback bad";
    }
  });

  archiveBtn.addEventListener("click", () => {
    showScreen("archived");
    if (soundOn && masterGain && audioCtx) {
      const now = audioCtx.currentTime;
      masterGain.gain.cancelScheduledValues(now);
      masterGain.gain.setValueAtTime(Math.max(masterGain.gain.value, 0.0001), now);
      masterGain.gain.exponentialRampToValueAtTime(0.015, now + 1.5);
    }
  });
})();
