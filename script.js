/* =========================================================
   Personal Website — script.js
   Features:
   1. Dark / light mode toggle with localStorage persistence
      (falls back to the OS preference on first visit)
   2. Mobile navigation drawer
   3. Scroll-spy for active nav links + a single sliding pill
      that glides between links (instead of per-link pills)
   4. Contact form — client-side validation demo (no backend; see note)
   5. Dynamic footer year
   6. Scroll reveal — sections/cards fade & slide in via
      IntersectionObserver; skill meters animate 0 → --level
   7. Hero stat count-up (6+ / 40+ / 2,400+) on first view
   8. Scroll-progress bar under the fixed header
   ========================================================= */

(function () {
  "use strict";

  var THEME_STORAGE_KEY = "pm-theme";

  /* ---------------------------------------------------------
     Theme toggle
     --------------------------------------------------------- */
  var themeToggle = document.getElementById("theme-toggle");
  var rootEl = document.documentElement;

  /** Read the saved theme; fall back to the OS preference. */
  function getStoredTheme() {
    try {
      return window.localStorage.getItem(THEME_STORAGE_KEY);
    } catch (err) {
      // localStorage can throw in private browsing / blocked cookies
      return null;
    }
  }

  function storeTheme(theme) {
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch (err) {
      // Non-fatal: theme just won't persist
    }
  }

  /** Pick an initial theme before the user ever toggles. */
  function resolveInitialTheme() {
    var stored = getStoredTheme();
    if (stored === "dark" || stored === "light") {
      return stored;
    }
    return window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }

  /** Apply a theme to the document and update the toggle's UI. */
  function applyTheme(theme) {
    rootEl.setAttribute("data-theme", theme);

    if (!themeToggle) return;

    // The sun/moon glyphs are static inline SVGs — the [data-theme]
    // attribute on <html> drives their cross-fade + rotation in CSS,
    // so JS only keeps the visible label and aria-label truthful.
    var label = themeToggle.querySelector(".theme-toggle__label");
    var next = theme === "dark" ? "light" : "dark";

    if (label) label.textContent = theme === "dark" ? "Light" : "Dark";
    themeToggle.setAttribute("aria-label", "Switch to " + next + " mode");
  }

  applyTheme(resolveInitialTheme());

  if (themeToggle) {
    themeToggle.addEventListener("click", function () {
      var current = rootEl.getAttribute("data-theme") === "dark" ? "dark" : "light";
      var next = current === "dark" ? "light" : "dark";
      applyTheme(next);
      storeTheme(next);
    });
  }

  /* ---------------------------------------------------------
     Mobile navigation
     --------------------------------------------------------- */
  var navToggle = document.getElementById("nav-toggle");
  var navMenu = document.getElementById("nav-menu");

  function closeMenu() {
    if (!navToggle || !navMenu) return;
    navMenu.classList.remove("is-open");
    navToggle.setAttribute("aria-expanded", "false");
    navToggle.setAttribute("aria-label", "Open menu");
  }

  function openMenu() {
    if (!navToggle || !navMenu) return;
    navMenu.classList.add("is-open");
    navToggle.setAttribute("aria-expanded", "true");
    navToggle.setAttribute("aria-label", "Close menu");
    // The drawer just became visible — measure the links now so the
    // sliding indicator isn't stuck at the size it had while hidden.
    window.requestAnimationFrame(function () {
      moveIndicatorTo(document.querySelector(".navbar__link.is-active"));
    });
  }

  if (navToggle && navMenu) {
    navToggle.addEventListener("click", function () {
      var isOpen = navMenu.classList.contains("is-open");
      if (isOpen) {
        closeMenu();
      } else {
        openMenu();
      }
    });

    // Close the drawer after choosing a destination.
    navMenu.addEventListener("click", function (event) {
      if (event.target.closest("a")) {
        closeMenu();
      }
    });

    // Close on Escape.
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") {
        closeMenu();
      }
    });

    // Reset state when resizing back to desktop so the menu
    // doesn't stay stuck open if the user rotates the device.
    var desktopQuery = window.matchMedia("(min-width: 769px)");
    var onDesktopChange = function (event) {
      if (event.matches) closeMenu();
    };
    if (typeof desktopQuery.addEventListener === "function") {
      desktopQuery.addEventListener("change", onDesktopChange);
    } else if (typeof desktopQuery.addListener === "function") {
      desktopQuery.addListener(onDesktopChange); // older Safari
    }
  }

  /* ---------------------------------------------------------
     Scroll-spy — highlight the section in view
     --------------------------------------------------------- */
  var sections = document.querySelectorAll("main section[id]");
  var navLinks = document.querySelectorAll(".navbar__link");
  var navIndicator = document.querySelector(".navbar__indicator");

  /** Glide the single shared pill to `link` (see .navbar__indicator).
      Offsets are measured against .navbar__list, which CSS makes
      position: relative, so the numbers line up at any breakpoint. */
  function moveIndicatorTo(link) {
    // offsetWidth is 0 while the mobile drawer is display:none —
    // skip and re-run when the menu opens (see openMenu below).
    if (!navIndicator || !link || !link.offsetWidth) return;
    navIndicator.style.width = link.offsetWidth + "px";
    navIndicator.style.height = link.offsetHeight + "px";
    navIndicator.style.transform =
      "translate(" + link.offsetLeft + "px, " + link.offsetTop + "px)";
    navIndicator.classList.add("is-on");
  }

  function setActiveLink(id) {
    var active = null;
    navLinks.forEach(function (link) {
      var isActive = link.getAttribute("href") === "#" + id;
      link.classList.toggle("is-active", isActive);
      if (isActive) {
        link.setAttribute("aria-current", "true");
        active = link;
      } else {
        link.removeAttribute("aria-current");
      }
    });
    moveIndicatorTo(active);
  }

  // Keep the pill glued to the active link through resizes
  // (padding/font changes between the mobile and desktop layouts).
  window.addEventListener("resize", function () {
    moveIndicatorTo(document.querySelector(".navbar__link.is-active"));
  });

  if ("IntersectionObserver" in window && sections.length) {
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            setActiveLink(entry.target.id);
          }
        });
      },
      {
        // Fire when a section occupies the middle band of the viewport.
        rootMargin: "-45% 0px -50% 0px",
        threshold: 0,
      }
    );

    sections.forEach(function (section) {
      observer.observe(section);
    });
  }

  /* ---------------------------------------------------------
     Contact form — client-side validation demo
     NOTE: There is no backend on this site. Nothing submitted
     here is stored, logged, or emailed. The handler below only
     demonstrates validation and always tells the user the truth
     about where their message went.
     --------------------------------------------------------- */
  var form = document.getElementById("contact-form");
  // NOTE: named formStatusEl (not statusEl) — the game section below also
  // needs a status element, and a shared name would collide (both are
  // function-scoped vars in this IIFE, so the second declaration would
  // silently win and form messages would land in #game-status).
  var formStatusEl = document.getElementById("form-status");

  function setFormStatus(message, isError) {
    if (!formStatusEl) return;
    formStatusEl.textContent = message;
    formStatusEl.classList.toggle("is-error", Boolean(isError));
  }

  if (form) {
    form.addEventListener("submit", function (event) {
      // Stop the browser's default submit: with no action/endpoint it
      // would just reload the page and silently lose the input.
      event.preventDefault();

      var nameInput = form.elements.namedItem("name");
      var emailInput = form.elements.namedItem("email");
      var messageInput = form.elements.namedItem("message");

      var name = nameInput ? nameInput.value.trim() : "";
      var email = emailInput ? emailInput.value.trim() : "";
      var message = messageInput ? messageInput.value.trim() : "";

      if (!name || !email || !message) {
        setFormStatus("Please fill in every field.", true);
        return;
      }

      var emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailPattern.test(email)) {
        setFormStatus("That email address doesn't look right.", true);
        if (emailInput) emailInput.focus();
        return;
      }

      // Validation passed. Be honest: this was NOT sent anywhere.
      setFormStatus(
        "Looks good, " + name +
          "! This form is a demo, so nothing was sent. " +
          "Please email hello@kientanquan.dev instead.",
        false
      );
      // Deliberately NOT calling form.reset(): clearing the fields would
      // destroy the visitor's only copy of a message we never delivered.
    });

    // Clear the error state as soon as the user starts fixing things.
    form.addEventListener("input", function () {
      if (formStatusEl && formStatusEl.classList.contains("is-error")) {
        setFormStatus("", false);
      }
    });
  }

  /* ---------------------------------------------------------
     Product — 4x4 memory matching game
     --------------------------------------------------------- */
  var board = document.getElementById("game-board");
  var movesEl = document.getElementById("game-moves");
  var matchesEl = document.getElementById("game-matches");
  var timeEl = document.getElementById("game-time");
  var gameStatusEl = document.getElementById("game-status");
  var restartBtn = document.getElementById("game-restart");

  if (board && movesEl && matchesEl && timeEl && gameStatusEl && restartBtn) {
    // 8 unique gems, each used twice = 16 cards on a 4x4 board.
    var GEMS = [
      { id: "purple-diamond", src: "assets/img-8.png", name: "Purple diamond" },
      { id: "green-circle", src: "assets/img-7.png", name: "Green circle" },
      { id: "orange-octagon", src: "assets/img-6.png", name: "Orange octagon" },
      { id: "blue-hexagon", src: "assets/img-5.png", name: "Blue hexagon" },
      { id: "pink-pentagon", src: "assets/img-4.png", name: "Pink pentagon" },
      { id: "lavender", src: "assets/img-3.png", name: "Lavender gem" },
      { id: "magenta-star", src: "assets/img-2.png", name: "Magenta star" },
      { id: "green-diamond", src: "assets/img-1.png", name: "Green diamond" }
    ];

    var PAIR_COUNT = GEMS.length;
    var LOCK_MS = 900;

    var deck = [];        // 16 card data objects, shuffled
    var firstCard = null; // card currently face-up awaiting a pair
    var lockBoard = false;
    var moves = 0;
    var matches = 0;
    var seconds = 0;
    var timerId = null;
    var unflipId = null;
    var gameToken = 0;    // invalidates stale timeouts after a restart
    var started = false;

    /** Fisher-Yates shuffle — returns a new array. */
    function shuffle(items) {
      var arr = items.slice();
      for (var i = arr.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var tmp = arr[i];
        arr[i] = arr[j];
        arr[j] = tmp;
      }
      return arr;
    }

    function formatTime(total) {
      var m = Math.floor(total / 60);
      var s = total % 60;
      var mm = m < 10 ? "0" + m : String(m);
      var ss = s < 10 ? "0" + s : String(s);
      return mm + ":" + ss;
    }

    function updateStats() {
      movesEl.textContent = String(moves);
      matchesEl.textContent = matches + " / " + PAIR_COUNT;
      timeEl.textContent = formatTime(seconds);
    }

    function setGameStatus(message, isWin) {
      gameStatusEl.textContent = message;
      gameStatusEl.classList.toggle("is-win", Boolean(isWin));
    }

    function stopTimer() {
      if (timerId !== null) {
        window.clearInterval(timerId);
        timerId = null;
      }
    }

    function startTimer() {
      if (timerId !== null) return;
      timerId = window.setInterval(function () {
        seconds += 1;
        timeEl.textContent = formatTime(seconds);
      }, 1000);
    }

    /** Build a single card element. */
    function createCard(gem) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "card";
      btn.dataset.gem = gem.id;
      btn.setAttribute("aria-label", "Face-down card");

      var inner = document.createElement("span");
      inner.className = "card__inner";

      var back = document.createElement("span");
      back.className = "card__face card__face--back";
      back.setAttribute("aria-hidden", "true");
      back.textContent = "?";

      var front = document.createElement("span");
      front.className = "card__face card__face--front";
      front.setAttribute("aria-hidden", "true");

      var img = document.createElement("img");
      img.className = "card__img";
      img.src = gem.src;
      img.alt = "";
      img.draggable = false;
      front.appendChild(img);

      inner.appendChild(back);
      inner.appendChild(front);
      btn.appendChild(inner);
      return btn;
    }

    /** Deal a fresh shuffled board into the DOM. */
    function buildBoard() {
      var pairs = [];
      GEMS.forEach(function (gem) {
        pairs.push(gem, gem);
      });
      deck = shuffle(pairs);

      // Clear any pending unflip from a previous round.
      if (unflipId !== null) {
        window.clearTimeout(unflipId);
        unflipId = null;
      }

      board.textContent = "";
      deck.forEach(function (gem) {
        board.appendChild(createCard(gem));
      });
    }

    function resetGame() {
      gameToken += 1;
      stopTimer();
      if (unflipId !== null) {
        window.clearTimeout(unflipId);
        unflipId = null;
      }

      firstCard = null;
      lockBoard = false;
      moves = 0;
      matches = 0;
      seconds = 0;
      started = false;

      buildBoard();
      updateStats();
      setGameStatus("Flip two cards to find a matching pair.", false);
    }

    function onMatch(a, b, gem) {
      [a, b].forEach(function (el) {
        el.classList.add("is-matched");
        el.classList.remove("is-flipped");
        el.setAttribute("aria-label", "Matched: " + gem.name);
      });
      firstCard = null;
      matches += 1;
      updateStats();

      if (matches === PAIR_COUNT) {
        stopTimer();
        setGameStatus(
          "You cleared the board in " +
            moves +
            " moves and " +
            formatTime(seconds) +
            ". 🎉",
          true
        );
      }
    }

    function onMismatch(a, b, token) {
      lockBoard = true;
      a.classList.add("is-wrong");
      b.classList.add("is-wrong");
      unflipId = window.setTimeout(function () {
        // A restart happened while we were waiting — bail out.
        if (token !== gameToken) return;
        [a, b].forEach(function (el) {
          el.classList.remove("is-flipped", "is-wrong");
          el.setAttribute("aria-label", "Face-down card");
        });
        firstCard = null;
        lockBoard = false;
        unflipId = null;
      }, LOCK_MS);
    }

    function handleFlip(card) {
      if (lockBoard) return;
      if (card.classList.contains("is-matched")) return;
      if (card === firstCard) return;

      if (!started) {
        started = true;
        startTimer();
      }

      card.classList.add("is-flipped");
      var gemId = card.dataset.gem;
      var gem = GEMS.filter(function (g) {
        return g.id === gemId;
      })[0];
      card.setAttribute("aria-label", gem ? gem.name : "Flipped card");

      if (!firstCard) {
        firstCard = card;
        return;
      }

      moves += 1;
      updateStats();

      var a = firstCard;
      var b = card;
      firstCard = null;

      if (a.dataset.gem === b.dataset.gem) {
        onMatch(a, b, gem);
      } else {
        onMismatch(a, b, gameToken);
      }
    }

    board.addEventListener("click", function (event) {
      var card = event.target.closest(".card");
      if (!card || !board.contains(card)) return;
      handleFlip(card);
    });

    restartBtn.addEventListener("click", function () {
      resetGame();
      var firstCardEl = board.querySelector(".card");
      if (firstCardEl) firstCardEl.focus();
    });

    resetGame();
  }

  /* ---------------------------------------------------------
     Motion — scroll reveal, stat count-up, scroll progress
     All progressive enhancement: without JS (or under
     prefers-reduced-motion) the page renders fully visible with
     the final stat values — script.js only adds the hidden start
     state, then hands off to IntersectionObserver.
     --------------------------------------------------------- */

  // --- 6. Scroll reveal -----------------------------------------
  var revealTargets = Array.prototype.slice.call(
    document.querySelectorAll(
      ".hero__avatar, .hero__eyebrow, .hero__title, .hero__subtitle, " +
        ".hero__bio, .hero__actions, .hero__stats, .section__header, " +
        ".skill-card, .game, .contact-card, .contact-form"
    )
  );

  var reducedMotion =
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (revealTargets.length && "IntersectionObserver" in window && !reducedMotion) {
    // Stagger siblings that share a parent so grids cascade in
    // instead of popping as one block (capped at 350ms).
    var delayCounts = new Map();
    revealTargets.forEach(function (el) {
      var index = delayCounts.get(el.parentElement) || 0;
      delayCounts.set(el.parentElement, index + 1);
      el.style.setProperty("--reveal-delay", Math.min(index * 70, 350) + "ms");
      el.classList.add("reveal");
    });

    var revealObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          // First sight of the hero stats kicks off the count-up.
          if (entry.target.classList.contains("hero__stats")) {
            animateStats(); // declared below — function declarations hoist
          }
          revealObserver.unobserve(entry.target); // reveal once
        });
      },
      // Trigger just before the element's bottom edge crosses in.
      { rootMargin: "0px 0px -60px 0px", threshold: 0 }
    );

    revealTargets.forEach(function (el) {
      revealObserver.observe(el);
    });
  }

  // --- 7. Hero stat count-up ------------------------------------
  var statPlan = Array.prototype.slice
    .call(document.querySelectorAll(".hero__stats .stat__value"))
    .map(function (el) {
      // Parse each label's final number ONCE, before any frames run:
      // "2,400+" → target 2400, suffix "+".
      var raw = el.textContent.trim();
      return {
        el: el,
        target: parseInt(raw.replace(/[^0-9]/g, ""), 10) || 0,
        suffix: raw.replace(/[0-9,]/g, "")
      };
    });
  var statsAnimated = false;

  /** Animate stats 0 → target with ease-out cubic. Runs at most once.
      When reveal is skipped (reduced motion / no IntersectionObserver)
      this is never called, so the values in index.html stay final. */
  function animateStats() {
    if (statsAnimated || !statPlan.length) return;
    statsAnimated = true;

    var DURATION = 1200;
    var startTime = null;

    function tick(now) {
      if (startTime === null) startTime = now;
      var progress = Math.min((now - startTime) / DURATION, 1);
      var eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      statPlan.forEach(function (stat) {
        var value = Math.round(stat.target * eased);
        stat.el.textContent = value.toLocaleString("en-US") + stat.suffix;
      });
      if (progress < 1) window.requestAnimationFrame(tick);
    }

    window.requestAnimationFrame(tick);
  }

  // --- 8. Scroll-progress bar -----------------------------------
  var progressEl = document.querySelector(".scroll-progress");
  var progressQueued = false;

  function updateScrollProgress() {
    progressQueued = false;
    if (!progressEl) return;
    var scrollable = document.documentElement.scrollHeight - window.innerHeight;
    var ratio = scrollable > 0 ? window.scrollY / scrollable : 0;
    // scaleX only — animates on the compositor, never touches layout.
    progressEl.style.transform =
      "scaleX(" + Math.min(Math.max(ratio, 0), 1) + ")";
  }

  if (progressEl) {
    // rAF-throttled: bursts of scroll events collapse into one repaint.
    window.addEventListener(
      "scroll",
      function () {
        if (progressQueued) return;
        progressQueued = true;
        window.requestAnimationFrame(updateScrollProgress);
      },
      { passive: true }
    );
    window.addEventListener("resize", updateScrollProgress);
    updateScrollProgress();
  }

  /* ---------------------------------------------------------
     Footer year
     --------------------------------------------------------- */
  var yearEl = document.getElementById("year");
  if (yearEl) {
    yearEl.textContent = String(new Date().getFullYear());
  }
})();
