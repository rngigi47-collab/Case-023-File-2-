
(() => {
  const ACCESS_CODE = "021026";
  const CORRECT = "B";

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
  let audioCtx = null, masterGain = null, nodes = [], soundOn = false;

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
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) {
      soundToggle.textContent = "♪ SOUND UNAVAILABLE";
      soundToggle.disabled = true;
      return;
    }
    audioCtx = audioCtx || new AC();
    if (audioCtx.state === "suspended") audioCtx.resume();

    masterGain = audioCtx.createGain();
    masterGain.gain.setValueAtTime(0.0001, audioCtx.currentTime);
    masterGain.gain.exponentialRampToValueAtTime(0.05, audioCtx.currentTime + 1.2);
    masterGain.connect(audioCtx.destination);

    const lowpass = audioCtx.createBiquadFilter();
    lowpass.type = "lowpass";
    lowpass.frequency.value = 520;
    lowpass.connect(masterGain);

    [[48, "sine", 0.7], [72, "triangle", 0.18], [96, "sine", 0.06]].forEach(([freq, type, gainValue]) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = type;
      osc.frequency.value = freq;
      gain.gain.value = gainValue;
      osc.connect(gain).connect(lowpass);
      osc.start();
      nodes.push(osc);
    });

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
    setTimeout(() => nodes.forEach(n => { try { n.stop(); } catch(e) {} }), 600);
    nodes = [];
    soundOn = false;
    soundToggle.setAttribute("aria-pressed", "false");
    soundToggle.textContent = "♪ SOUND: OFF";
  }

  soundToggle.addEventListener("click", () => soundOn ? stopSound() : startSound());

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

      progressText.textContent = `${revealed.size} / 3 records reviewed`;

      if (revealed.size === subjectCards.length) {
        questionPanel.classList.remove("hidden");
        progressText.textContent = "All records reviewed. Assessment unlocked.";
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

    if (selected.value === CORRECT) {
      feedback.textContent = "Correct. Assessment complete. Opening result…";
      feedback.className = "feedback good";
      quizForm.querySelectorAll("input,button").forEach(el => el.disabled = true);
      setTimeout(() => showScreen("result"), 700);
    } else {
      const hints = {
        A: "Too literal. Anger is only one disguise in the file.",
        C: "No. The records point to a hidden force, not simply a missing habit.",
        D: "Control appears in some records, but it is not the common suspect."
      };
      feedback.textContent = hints[selected.value] || "Reassess the evidence.";
      feedback.className = "feedback bad";
    }
  });

  archiveBtn.addEventListener("click", () => showScreen("archived"));
})();
