document.addEventListener("DOMContentLoaded", () => {
  /* ---------------------------------------------------------------
     PORTFOLIO CATEGORY FILTERS
  --------------------------------------------------------------- */
  const filterButtons = document.querySelectorAll(".filter-btn");
  const projectCards = document.querySelectorAll(".project-card");

  filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const filter = button.dataset.filter;

      filterButtons.forEach((item) => {
        const active = item === button;
        item.classList.toggle("active", active);
        item.setAttribute("aria-pressed", String(active));
      });

      projectCards.forEach((card) => {
        const matches = filter === "all" || card.dataset.category === filter;
        card.classList.toggle("is-hidden", !matches);
      });
    });
  });

  /* ---------------------------------------------------------------
     SMOOTH SCROLL FOR SAME-PAGE LINKS
  --------------------------------------------------------------- */
  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener("click", (event) => {
      const targetId = link.getAttribute("href");
      if (!targetId || targetId === "#") return;

      const target = document.querySelector(targetId);
      if (target) {
        event.preventDefault();
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  });

  /* ---------------------------------------------------------------
     HERO PORTRAIT FALLBACK (show placeholder if the png fails)
  --------------------------------------------------------------- */
  const modelImage = document.querySelector(".hero-model");

  if (modelImage) {
    const markMissing = () => modelImage.parentElement.classList.add("is-missing");

    if (modelImage.complete) {
      if (modelImage.naturalWidth === 0) markMissing();
    } else {
      modelImage.addEventListener("error", markMissing);
    }
  }

  /* ---------------------------------------------------------------
     SCROLL REVEAL ENGINE
     every block fades/slides in, every heading reveals word by word
  --------------------------------------------------------------- */
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const revealTargets = [];

  /* -- word splitter: turns a heading into per-word spans --------- */
  const splitWords = (element) => {
    const wrapText = (node) => {
      Array.from(node.childNodes).forEach((child) => {
        if (child.nodeType === Node.TEXT_NODE) {
          const fragment = document.createDocumentFragment();

          child.textContent.split(/(\s+)/).forEach((part) => {
            if (!part) return;

            if (!part.trim()) {
              fragment.appendChild(document.createTextNode(" "));
              return;
            }

            const word = document.createElement("span");
            word.className = "w";
            const inner = document.createElement("i");
            inner.textContent = part;
            word.appendChild(inner);
            fragment.appendChild(word);
          });

          node.replaceChild(fragment, child);
        } else if (child.nodeType === Node.ELEMENT_NODE && child.tagName !== "BR") {
          wrapText(child);
        }
      });
    };

    wrapText(element);
    return Array.from(element.querySelectorAll(".w > i"));
  };

  /* -- block groups: selector + motion + stagger ------------------ */
  const BLOCK_GROUPS = [
    { sel: ".section-kicker", v: "rv-left" },
    { sel: ".section-heading .section-intro, .about-title .small-label, .contact-overline, .skills-aside .small-label", v: "rv-up" },
    { sel: ".work-toolbar", v: "rv-up" },
    { sel: ".project-visual", v: "rv-clip", stagger: 130, max: 390, offset: 0, groupBy: (el) => el.closest(".project-grid") },
    { sel: ".project-meta", v: "rv-up", stagger: 130, max: 390, offset: 70, groupBy: (el) => el.closest(".project-grid") },
    { sel: ".portfolio-note", v: "rv-up" },
    { sel: ".section-endline", v: "rv-up" },
    { sel: ".about-stamp", v: "rv-scale" },
    { sel: ".about-copy > *", v: "rv-up", stagger: 90, max: 360 },
    { sel: ".about-values > div", v: "rv-up", stagger: 110, max: 330 },
    { sel: ".timeline-item", v: "rv-up", stagger: 90, max: 450 },
    { sel: ".timeline-divider", v: "rv-left" },
    { sel: ".skills-group-heading", v: "rv-left" },
    { sel: ".skill-row", v: "rv-up", stagger: 70, max: 450 },
    { sel: ".skills-aside", v: "rv-scale" },
    { sel: ".skill-tags span", v: "rv-scale", stagger: 55, max: 280 },
    { sel: ".contact-bottom > p", v: "rv-up" },
    { sel: ".contact-link", v: "rv-right", stagger: 110, max: 220 },
    { sel: ".site-footer > *", v: "rv-up", stagger: 90, max: 180 }
  ];

  /* -- headings that reveal word by word -------------------------- */
  const WORD_TARGETS = [
    ".section-heading h2",
    ".about-title h2",
    ".contact-section h2",
    ".skills-aside h3",
    ".column-heading h3",
    ".project-meta h3",
    ".timeline-item h4",
    ".section-endline span"
  ];

  /* -- apply a block reveal --------------------------------------- */
  const applyBlock = (element, variant, delay) => {
    element.classList.add("reveal", variant);
    element.style.setProperty("--rd", `${delay}ms`);
    revealTargets.push(element);
  };

  BLOCK_GROUPS.forEach((group) => {
    const elements = Array.from(document.querySelectorAll(group.sel));
    if (!elements.length) return;

    const buckets = new Map();

    elements.forEach((element) => {
      const key = group.groupBy ? group.groupBy(element) : element.parentElement;
      if (!buckets.has(key)) buckets.set(key, []);
      buckets.get(key).push(element);
    });

    buckets.forEach((bucket) => {
      bucket.forEach((element, index) => {
        const delay = Math.min(index * (group.stagger || 0), group.max || 600) + (group.offset || 0);
        applyBlock(element, group.v, delay);
      });
    });
  });

  /* -- word by word headings -------------------------------------- */
  WORD_TARGETS.forEach((selector) => {
    document.querySelectorAll(selector).forEach((element) => {
      const before = element.offsetHeight;
      const words = splitWords(element);

      words.forEach((word, index) => {
        word.parentElement.classList.add("w-mask");
        word.style.setProperty("--wd", `${Math.min(index * 55, 620)}ms`);
      });

      /* masked words must never change the typography: if the line box
         grew (tight display headings), fall back to the soft variant */
      if (Math.abs(element.offsetHeight - before) > 1) {
        words.forEach((word) => {
          word.parentElement.classList.remove("w-mask");
          word.parentElement.classList.add("w-soft");
        });
      }

      element.classList.add("rv-words");
      revealTargets.push(element);
    });
  });

  /* -- observer: reveal each element the moment it scrolls in ------ */
  const show = (element) => {
    element.classList.add("is-in");
    if (element.classList.contains("skill-row")) element.classList.add("in-view");
  };

  if (reduceMotion || !("IntersectionObserver" in window)) {
    revealTargets.forEach(show);
    document.querySelectorAll(".skill-row").forEach((row) => row.classList.add("in-view"));
  } else {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          show(entry.target);
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0, rootMargin: "0px 0px -6% 0px" }
    );

    revealTargets.forEach((element) => observer.observe(element));

    /* safety net: the very last elements still get revealed */
    window.addEventListener(
      "scroll",
      () => {
        if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 80) {
          revealTargets.forEach(show);
        }
      },
      { passive: true }
    );
  }

  /* -- skill progress bars ---------------------------------------- */
  const skillRows = document.querySelectorAll(".skill-row");

  skillRows.forEach((row) => {
    const level = Number(row.dataset.level);
    const fill = row.querySelector(".skill-fill");

    if (fill && Number.isFinite(level)) {
      fill.style.setProperty("--level", `${Math.min(100, Math.max(0, level))}%`);
    }
  });

  /* -- hero entrance ----------------------------------------------- */
  const HERO_PARTS = [
    { sel: ".site-header", v: "rv-down", d: 0 },
    { sel: ".hero-photo-strip", v: "", d: 120 },
    { sel: ".hero-name", v: "", d: 200 },
    { sel: ".hero-model-wrap", v: "rv-up", d: 260 },
    { sel: ".hero-bottom", v: "rv-up", d: 430 },
    { sel: ".scroll-cue", v: "", d: 540 }
  ];

  HERO_PARTS.forEach((part) => {
    const element = document.querySelector(part.sel);
    if (!element) return;
    element.classList.add("hero-in");
    if (part.v) element.classList.add(part.v);
    element.style.setProperty("--rd", `${part.d}ms`);
  });

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      document.querySelectorAll(".hero-in").forEach((element) => element.classList.add("is-in"));
    });
  });
});
