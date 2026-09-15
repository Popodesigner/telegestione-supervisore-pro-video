(() => {
  "use strict";

  document.documentElement.classList.add("standalone-ready");

  const scenarios = [
    {
      plant: "Centrale termica 04",
      value: "87.4 °C",
      status: "Soglia alta",
      channel: "Telegram",
      message: "Temperatura oltre il limite configurato",
      explanation:
        "Supervisore Pro rileva la soglia anomala e porta l’informazione dal campo alla persona reperibile.",
      icon: '<path d="M14 4v10.54a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0Z"></path>',
    },
    {
      plant: "Impianto trattamento 02",
      value: "12%",
      status: "Livello basso",
      channel: "WhatsApp",
      message: "Prodotto anticorrosivo quasi esaurito",
      explanation:
        "Il livello residuo genera una notifica prima che il prodotto finisca, consentendo di programmare il rifornimento.",
      icon:
        '<path d="M7 16.3c2.2 0 4-1.83 4-4.05 0-1.16-.57-2.26-1.71-3.19S7.29 6.75 7 5.3c-.29 1.45-1.14 2.84-2.29 3.76S3 11.1 3 12.25c0 2.22 1.8 4.05 4 4.05z"></path><path d="M12.56 6.6A10.97 10.97 0 0 0 14 3.02c.5 2.5 2 4.9 4 6.5s3 3.5 3 5.5a6.98 6.98 0 0 1-11.91 4.97"></path>',
    },
    {
      plant: "Centrale tecnica 07",
      value: "BAT. 94%",
      status: "Rete assente",
      channel: "Telegram",
      message: "Blackout rilevato: supervisione attiva su batteria tampone",
      explanation:
        "Quando manca la corrente, l’alimentazione di backup mantiene acceso il Supervisore e l’allarme parte immediatamente.",
      icon:
        '<path d="m11 7-3 5h4l-3 5"></path><path d="M14.856 6H16a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.935"></path><path d="M22 14v-4"></path><path d="M5.14 18H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h2.936"></path>',
    },
  ];

  const scenarioTabs = [...document.querySelectorAll(".scenario-tab")];
  const consolePanel = document.querySelector(".simulation-console");
  const plantName = document.querySelector(".plant-node-top span");
  const plantValue = document.querySelector(".plant-node > strong");
  const alarmStatus = document.querySelector(".alarm-status");
  const mainIcon = document.querySelector(".scenario-main-icon");
  const notificationChannel = document.querySelector(".notification-top div span");
  const notificationMessage = document.querySelector(".notification-card > p");
  const notificationLocation = document.querySelector(".notification-location");
  const scenarioExplanation = document.querySelector(".scenario-explanation");

  function activateScenario(index) {
    const scenario = scenarios[index];
    if (!scenario || !consolePanel) return;

    scenarioTabs.forEach((button, buttonIndex) => {
      button.setAttribute("aria-selected", String(buttonIndex === index));
      button.tabIndex = buttonIndex === index ? 0 : -1;
    });

    consolePanel.classList.remove("scenario-flash");
    void consolePanel.offsetWidth;
    consolePanel.classList.add("scenario-flash");

    if (plantName) plantName.textContent = scenario.plant;
    if (plantValue) plantValue.textContent = scenario.value;
    if (alarmStatus) alarmStatus.textContent = scenario.status;
    if (mainIcon) mainIcon.innerHTML = scenario.icon;
    if (notificationChannel)
      notificationChannel.textContent = `Notifica ${scenario.channel}`;
    if (notificationMessage) notificationMessage.textContent = scenario.message;
    if (notificationLocation) notificationLocation.textContent = scenario.plant;
    if (scenarioExplanation)
      scenarioExplanation.textContent = scenario.explanation;
  }

  scenarioTabs.forEach((button, index) => {
    button.addEventListener("click", () => activateScenario(index));
    button.addEventListener("keydown", (event) => {
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
      event.preventDefault();
      const direction = event.key === "ArrowRight" ? 1 : -1;
      const next = (index + direction + scenarioTabs.length) % scenarioTabs.length;
      scenarioTabs[next].focus();
      activateScenario(next);
    });
  });

  const scrub = document.querySelector(".scroll-scrub");
  const layers = [...document.querySelectorAll("[data-scroll-scrub-layer]")];
  const scrubVideos = layers.map((layer, index) => {
    const scene = String(index + 1).padStart(2, "0");
    const video = document.createElement("video");
    const mobileSource = document.createElement("source");
    const desktopSource = document.createElement("source");

    video.className = "scroll-scrub__video";
    video.autoplay = false;
    video.loop = false;
    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;
    video.preload = index === 0 ? "auto" : "metadata";
    video.setAttribute("muted", "");
    video.setAttribute("playsinline", "");
    video.setAttribute("aria-hidden", "true");

    mobileSource.media = "(max-width: 860px)";
    mobileSource.src = `/telegestione-supervisore-pro-video/assets/world/scene-${scene}-mobile.mp4`;
    mobileSource.type = "video/mp4";
    desktopSource.src = `/telegestione-supervisore-pro-video/assets/world/scene-${scene}.mp4`;
    desktopSource.type = "video/mp4";

    video.append(mobileSource, desktopSource);
    layer.querySelector(".scroll-scrub__picture")?.after(video);
    video.addEventListener("loadeddata", () => {
      layer.dataset.videoPainted = "true";
      requestScrubUpdate();
    });
    video.addEventListener("loadedmetadata", requestScrubUpdate);
    video.addEventListener("error", () => {
      delete layer.dataset.videoPainted;
    });

    return video;
  });
  const chapters = [...document.querySelectorAll("[data-scroll-scrub-band]")];
  const routeButtons = [...document.querySelectorAll(".scroll-scrub__route-button")];
  let framePending = false;
  const seekThreshold = window.matchMedia(
    "(hover: none) and (pointer: coarse)",
  ).matches
    ? 0.02
    : 0.008;

  function setVideoProgress(video, progress) {
    if (!video || !Number.isFinite(video.duration) || video.duration <= 0) return;

    const targetTime =
      video.duration * Math.min(0.999, Math.max(0, progress));
    if (Math.abs(video.currentTime - targetTime) > seekThreshold) {
      video.currentTime = targetTime;
    }
  }

  routeButtons.forEach((button, index) => {
    button.addEventListener("click", () => {
      const chapter = chapters[index];
      if (!chapter) return;
      const rect = chapter.getBoundingClientRect();
      window.scrollTo({
        behavior: "smooth",
        top: window.scrollY + rect.top + rect.height * 0.15,
      });
    });
  });

  function updateScrub() {
    framePending = false;
    if (!scrub || !chapters.length) return;

    const scrubRect = scrub.getBoundingClientRect();
    const scrollPosition = Math.min(
      scrubRect.height,
      Math.max(0, -scrubRect.top),
    );
    const fadeDistance = Math.max(1, window.innerHeight * 0.1);
    const chapterRects = chapters.map((chapter) =>
      chapter.getBoundingClientRect(),
    );
    let active = 0;

    chapterRects.forEach((rect, index) => {
      const start = rect.top - scrubRect.top;
      if (scrollPosition >= start) active = index;
    });

    const activeRect = chapterRects[active];
    const activeStart = activeRect.top - scrubRect.top;
    const activeEnd = activeStart + activeRect.height;
    const activeProgress = Math.min(
      1,
      Math.max(
        0,
        (scrollPosition - activeStart) / Math.max(1, activeEnd - activeStart),
      ),
    );

    layers.forEach((layer, index) => {
      const rect = chapterRects[index];
      const start = rect.top - scrubRect.top;
      const end = start + rect.height;
      let distance = 0;
      if (scrollPosition < start) distance = start - scrollPosition;
      if (scrollPosition > end) distance = scrollPosition - end;
      const fade = Math.min(1, Math.max(0, 1 - distance / fadeDistance));
      const opacity = fade * fade * (3 - 2 * fade);

      layer.style.opacity = String(opacity);
      layer.style.zIndex = index === active ? "2" : "1";
      layer.style.transform = index === active ? "scale(1)" : "scale(1.035)";

      const video = scrubVideos[index];
      if (opacity > 0.001 && video?.readyState === 0) video.load();
      if (index === active) setVideoProgress(video, activeProgress);
    });

    scrub.dataset.activeScene = String(active + 1);
    scrub.dataset.sceneProgress = activeProgress.toFixed(4);
    routeButtons.forEach((button, index) => {
      if (index === active) button.setAttribute("aria-current", "step");
      else button.removeAttribute("aria-current");
    });

    const progress = scrollPosition / Math.max(1, scrubRect.height);
    scrub.style.setProperty("--ss-progress", progress.toFixed(4));
  }

  function requestScrubUpdate() {
    if (framePending) return;
    framePending = true;
    requestAnimationFrame(updateScrub);
  }

  window.addEventListener("scroll", requestScrubUpdate, { passive: true });
  window.addEventListener("resize", requestScrubUpdate);
  updateScrub();

  const revealTargets = document.querySelectorAll(
    ".chain-flow li, .simulation-console, .comparison-grid, .modular-grid article, .field-strip figure, .video-tile, .roadmap-track article, .faq-list details",
  );
  revealTargets.forEach((element) => element.setAttribute("data-reveal", ""));

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-revealed");
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -6%" },
    );
    revealTargets.forEach((element) => observer.observe(element));
  } else {
    revealTargets.forEach((element) => element.classList.add("is-revealed"));
  }
})();

