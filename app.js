(() => {
  const chapters = window.TAO_CHAPTERS || [];
  const page = document.getElementById("chapter-page");
  const toc = document.getElementById("toc");
  const tocBody = document.getElementById("toc-body");
  const tocStat = document.getElementById("toc-stat");
  const tocToggle = document.getElementById("toc-toggle");
  const tocClose = document.getElementById("toc-close");
  const bar = document.querySelector(".bar");
  const threadFill = document.getElementById("thread-fill");
  const footProgress = document.getElementById("foot-progress");

  const STORE_LAST = "tao:last";
  const STORE_FLOW = "tao:flow";
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const NOTES = [
    { key: "aiInterpretation", label: "AI 解读", kind: "note--ai" },
    { key: "aiDialogue", label: "与 AI 对谈", kind: "note--dialogue" },
    { key: "personalUnderstanding", label: "心得", kind: "note--self" },
    { key: "sharedReading", label: "与人共读", kind: "note--shared" }
  ];
  const CONTENT_KEYS = ["image", ...NOTES.map((note) => note.key), "quote"];

  const pad = (n) => String(n).padStart(2, "0");
  const field = (chapter, key) => String(chapter[key] || "").trim();
  const escapeHTML = (value) => String(value).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[c]);

  const store = {
    get(key) {
      try { return window.localStorage.getItem(key); } catch { return null; }
    },
    set(key, value) {
      try { window.localStorage.setItem(key, value); } catch { /* storage unavailable */ }
    }
  };

  function firstClause(text) {
    const match = String(text).match(/^[^，。；：！？]+/);
    return (match ? match[0] : String(text)).trim();
  }

  function splitClauses(text) {
    const found = String(text).match(/[^；。！？]+[；。！？]?/g);
    return (found || [text]).map((line) => line.trim()).filter(Boolean);
  }

  // 每个分句不可拆开，换行只会落在逗号等标点之后
  function clauseMarkup(line) {
    const parts = String(line).match(/[^，、：]+[，、：]?/g) || [line];
    return parts.map((part) => `<span class="clause">${escapeHTML(part)}</span>`).join("");
  }

  function paragraphs(text) {
    return String(text).split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  }

  function partName(id) {
    return id <= 37 ? "上篇 · 道经" : "下篇 · 德经";
  }

  function isFilled(chapter) {
    return CONTENT_KEYS.some((key) => field(chapter, key));
  }

  function chapterById(id) {
    return chapters.find((item) => item.id === id);
  }

  function chapterFromHash() {
    const match = window.location.hash.match(/^#chapter-(\d{1,2})$/);
    if (match) return chapterById(Number(match[1])) || chapters[0];
    return chapterById(Number(store.get(STORE_LAST))) || chapters[0];
  }

  function sizeHero() {
    const hero = page.querySelector(".hero-clause");
    const heroBox = page.querySelector(".hero");
    if (!hero || !heroBox || !hero.dataset.chars) return;
    const style = getComputedStyle(heroBox);
    const avail = heroBox.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
    const chars = Number(hero.dataset.chars);
    const perLine = window.innerWidth < 700 && chars > 5 ? Math.ceil(chars / 2) : chars;
    const size = Math.min((avail / perLine) * 0.82, window.innerWidth * 0.15, window.innerHeight * 0.2, 200);
    hero.style.fontSize = Math.max(size, 26) + "px";
  }

  function noteBodyMarkup(note, text) {
    if (note.key !== "aiDialogue") {
      return paragraphs(text).map((p) => `<p>${escapeHTML(p)}</p>`).join("");
    }
    return paragraphs(text).map((p) => {
      const turn = p.match(/^(问|答)[：:]\s*([\s\S]*)$/);
      if (!turn) return `<p>${escapeHTML(p)}</p>`;
      const isQuestion = turn[1] === "问";
      return `<p class="${isQuestion ? "q" : "a"}"><span class="who" aria-hidden="true">${isQuestion ? "问" : "答"}</span>${escapeHTML(turn[2])}</p>`;
    }).join("");
  }

  function plateMarkup(chapter, clause) {
    const image = field(chapter, "image");
    const imageNote = field(chapter, "imageNote");
    if (!image) {
      return `
        <figure class="plate plate--void" aria-label="此章尚无配图">
          <span class="void-glow" aria-hidden="true"></span>
          <svg class="enso" viewBox="0 0 200 200" aria-hidden="true">
            <circle cx="100" cy="100" r="80" fill="none" stroke="currentColor" stroke-width="1.4"
              stroke-linecap="round" stroke-dasharray="470 40" transform="rotate(-70 100 100)"/>
          </svg>
        </figure>
        <p class="plate-caption">象未成，此处为虚</p>`;
    }
    return `
      <figure class="plate">
        <img src="${escapeHTML(image)}" alt="${escapeHTML(clause)} 的意象" decoding="async">
      </figure>
      <div class="plate-caption">
        此图为 AI 依本章意会所作
        ${imageNote ? `<details><summary>创作思路</summary><p class="plate-note">${escapeHTML(imageNote)}</p></details>` : ""}
      </div>`;
  }

  function renderChapter(chapter) {
    const clause = firstClause(chapter.text);
    const lines = splitClauses(chapter.text);
    const previous = chapterById(chapter.id - 1);
    const next = chapterById(chapter.id + 1);
    const filled = NOTES.filter((note) => field(chapter, note.key));
    const quote = field(chapter, "quote");
    const vertical = store.get(STORE_FLOW) === "vertical";

    const notesMarkup = filled.length
      ? filled.map((note) => `
          <section class="note ${note.kind} reveal">
            <h2 class="note-label">${note.label}</h2>
            <div class="note-body${note.key === "aiDialogue" ? " dialogue" : ""}">${noteBodyMarkup(note, field(chapter, note.key))}</div>
          </section>`).join("")
      : `<p class="notes-empty reveal">此处留白，待悟<small>${NOTES.map((note) => note.label).join(" · ")}</small></p>`;

    page.innerHTML = `
      <article class="chapter">
        <section class="hero">
          <span class="hero-seal">${chapter.title}</span>
          <h1 class="hero-clause" data-chars="${[...clause].length}">${escapeHTML(clause)}</h1>
          <span class="hero-part">${partName(chapter.id)}</span>
          <span class="hero-cue" aria-hidden="true"></span>
        </section>

        <section class="scripture${vertical ? " is-vertical" : ""}" aria-label="原文">
          <div class="scripture-head">
            <span>原文</span>
            <button class="flow-btn" type="button" aria-pressed="${vertical}">${vertical ? "横排" : "竖排"}</button>
          </div>
          <p class="scripture-text">${lines
            .map((line, index) => `<span class="line" style="transition-delay:${Math.min(index, 8) * 90}ms">${clauseMarkup(line)}</span>`)
            .join("")}</p>
        </section>

        ${plateMarkup(chapter, clause)}

        <section class="notes" aria-label="札记">
          <div class="notes-inner">${notesMarkup}</div>
        </section>

        <section class="coda reveal" aria-hidden="${quote ? "false" : "true"}">
          ${quote ? `<p class="coda-quote">${escapeHTML(quote)}</p>` : ""}
          <span class="coda-mark">○</span>
        </section>

        <nav class="pager" aria-label="章节翻页">
          ${previous
            ? `<a class="pager-link prev" href="#chapter-${pad(previous.id)}">
                 <span class="pager-dir">上一章 · ${previous.title}</span>
                 <span class="pager-clause">${escapeHTML(firstClause(previous.text))}</span>
               </a>`
            : `<span class="pager-link prev is-end"><span class="pager-dir">道经之首</span><span class="pager-clause">卷首</span></span>`}
          ${next
            ? `<a class="pager-link next" href="#chapter-${pad(next.id)}">
                 <span class="pager-dir">下一章 · ${next.title}</span>
                 <span class="pager-clause">${escapeHTML(firstClause(next.text))}</span>
               </a>`
            : `<span class="pager-link next is-end"><span class="pager-dir">德经之末</span><span class="pager-clause">卷末</span></span>`}
        </nav>
      </article>`;

    sizeHero();
    bindChapter();
    footProgress.textContent = `${chapter.title} · 共八十一章`;
    document.title = `${clause} · 道德经`;
    store.set(STORE_LAST, String(chapter.id));

    tocBody.querySelectorAll(".toc-row").forEach((row) => {
      row.setAttribute("aria-current", String(Number(row.dataset.id) === chapter.id));
    });
  }

  const observer = "IntersectionObserver" in window
    ? new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-in");
        observer.unobserve(entry.target);
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.15 })
    : null;

  function watchReveals() {
    const targets = page.querySelectorAll(".line, .reveal");
    if (!observer || reducedMotion) {
      targets.forEach((el) => el.classList.add("is-in"));
      return;
    }
    targets.forEach((el) => observer.observe(el));
  }

  function bindChapter() {
    watchReveals();

    const img = page.querySelector(".plate img");
    if (img) {
      const show = () => img.classList.add("is-loaded");
      if (img.complete) show(); else img.addEventListener("load", show, { once: true });
    }

    const flowBtn = page.querySelector(".flow-btn");
    const scripture = page.querySelector(".scripture");
    flowBtn.addEventListener("click", () => {
      const vertical = scripture.classList.toggle("is-vertical");
      store.set(STORE_FLOW, vertical ? "vertical" : "horizontal");
      flowBtn.textContent = vertical ? "横排" : "竖排";
      flowBtn.setAttribute("aria-pressed", String(vertical));
    });
  }

  function buildToc() {
    const row = (chapter) => `
      <a class="toc-row${isFilled(chapter) ? " is-filled" : ""}" href="#chapter-${pad(chapter.id)}" data-id="${chapter.id}">
        <span class="toc-row-no">${pad(chapter.id)}</span>
        <span class="toc-row-clause">${escapeHTML(firstClause(chapter.text))}</span>
        <span class="toc-row-dot" aria-hidden="true"></span>
      </a>`;

    tocBody.innerHTML = `
      <div class="toc-col">
        <div class="toc-part">上篇 道经 · 一至三十七</div>
        ${chapters.filter((c) => c.id <= 37).map(row).join("")}
      </div>
      <div class="toc-col">
        <div class="toc-part">下篇 德经 · 三十八至八十一</div>
        ${chapters.filter((c) => c.id >= 38).map(row).join("")}
      </div>`;

    tocStat.textContent = `已有札记 ${chapters.filter(isFilled).length} / ${chapters.length}`;
  }

  function openToc() {
    toc.hidden = false;
    tocToggle.setAttribute("aria-expanded", "true");
    document.body.classList.add("is-locked");
    const current = tocBody.querySelector('.toc-row[aria-current="true"]');
    if (current) current.scrollIntoView({ block: "center" });
    tocClose.focus({ preventScroll: true });
  }

  function closeToc() {
    toc.hidden = true;
    tocToggle.setAttribute("aria-expanded", "false");
    document.body.classList.remove("is-locked");
    tocToggle.focus({ preventScroll: true });
  }

  let firstRender = true;

  function goToHash() {
    const chapter = chapterFromHash();
    const expected = `#chapter-${pad(chapter.id)}`;
    if (window.location.hash !== expected) {
      window.history.replaceState(null, "", expected);
    }

    const show = () => {
      renderChapter(chapter);
      window.scrollTo({ top: 0, behavior: "instant" });
      bar.classList.remove("is-hidden");
      updateThread();
      page.classList.remove("is-leaving");
    };

    if (firstRender || reducedMotion) {
      firstRender = false;
      show();
      return;
    }
    page.classList.add("is-leaving");
    window.setTimeout(show, 520);
  }

  function go(offset) {
    const target = chapterById(chapterFromHash().id + offset);
    if (target) window.location.hash = `chapter-${pad(target.id)}`;
  }

  let lastY = 0;
  function updateThread() {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    threadFill.style.transform = `scaleY(${max > 0 ? Math.min(window.scrollY / max, 1) : 0})`;
  }

  function onScroll() {
    const y = window.scrollY;
    bar.classList.toggle("is-hidden", y > 120 && y > lastY);
    lastY = y;
    updateThread();
  }

  if ("scrollRestoration" in window.history) window.history.scrollRestoration = "manual";
  buildToc();
  goToHash();

  window.addEventListener("hashchange", () => {
    if (!toc.hidden) closeToc();
    goToHash();
  });

  window.addEventListener("resize", () => {
    sizeHero();
    updateThread();
  });

  window.addEventListener("scroll", onScroll, { passive: true });

  tocToggle.addEventListener("click", () => (toc.hidden ? openToc() : closeToc()));
  tocClose.addEventListener("click", closeToc);
  tocBody.addEventListener("click", (event) => {
    if (event.target.closest(".toc-row")) closeToc();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !toc.hidden) {
      closeToc();
      return;
    }
    if (event.altKey || event.ctrlKey || event.metaKey || !toc.hidden) return;
    const tag = document.activeElement && document.activeElement.tagName;
    if (["INPUT", "TEXTAREA", "SELECT"].includes(tag)) return;
    if (event.key === "ArrowLeft") go(-1);
    if (event.key === "ArrowRight") go(1);
  });

  let touch = null;
  page.addEventListener("touchstart", (event) => {
    if (event.touches.length !== 1 || event.target.closest(".scripture.is-vertical")) {
      touch = null;
      return;
    }
    touch = { x: event.touches[0].clientX, y: event.touches[0].clientY };
  }, { passive: true });

  page.addEventListener("touchend", (event) => {
    if (!touch) return;
    const dx = event.changedTouches[0].clientX - touch.x;
    const dy = event.changedTouches[0].clientY - touch.y;
    touch = null;
    if (Math.abs(dx) > 80 && Math.abs(dx) > Math.abs(dy) * 2) go(dx < 0 ? 1 : -1);
  }, { passive: true });
})();
