(() => {
  const chapters = window.TAO_CHAPTERS || [];
  const page = document.getElementById("chapter-page");
  const toc = document.getElementById("toc");
  const tocBody = document.getElementById("toc-body");
  const tocToggle = document.getElementById("toc-toggle");
  const tocClose = document.getElementById("toc-close");
  const bar = document.querySelector(".bar");
  const barPart = document.getElementById("bar-part");
  const footProgress = document.getElementById("foot-progress");

  const NOTES = [
    { key: "personalUnderstanding", label: "个人理解", kind: "note--primary" },
    { key: "aiInterpretation", label: "AI 解读", kind: "" },
    { key: "sharedReading", label: "与人共读", kind: "note--quote" },
    { key: "aiDialogue", label: "与 AI 对谈", kind: "note--quote" }
  ];

  const pad = (n) => String(n).padStart(2, "0");
  const escapeHTML = (value) => String(value).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[c]);

  function firstClause(text) {
    const match = String(text).match(/^[^，。；：！？]+/);
    return (match ? match[0] : String(text)).trim();
  }

  function splitClauses(text) {
    const found = String(text).match(/[^；。！？]+[；。！？]?/g);
    return (found || [text]).map((line) => line.trim()).filter(Boolean);
  }

  function partName(id) {
    return id <= 37 ? "上篇 · 道经" : "下篇 · 德经";
  }

  function chapterFromHash() {
    const match = window.location.hash.match(/^#chapter-(\d{1,2})$/);
    const id = match ? Number(match[1]) : 1;
    return chapters.find((item) => item.id === id) || chapters[0];
  }

  function sizeHero() {
    const hero = page.querySelector(".hero-clause");
    const heroBox = page.querySelector(".hero");
    if (!hero || !heroBox || !hero.dataset.chars) return;
    const style = getComputedStyle(heroBox);
    const avail = heroBox.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
    const chars = Number(hero.dataset.chars);
    const perLine = window.innerWidth < 700 && chars > 6 ? Math.ceil(chars / 2) : chars;
    const size = Math.min((avail / perLine) * 0.96, window.innerWidth * 0.16, 260);
    hero.style.fontSize = Math.max(size, 22) + "px";
  }

  function renderChapter(chapter) {
    const clause = firstClause(chapter.text);
    const lines = splitClauses(chapter.text);
    const previous = chapters.find((item) => item.id === chapter.id - 1);
    const next = chapters.find((item) => item.id === chapter.id + 1);
    const filled = NOTES.filter((note) => String(chapter[note.key] || "").trim());

    const notesMarkup = filled.length
      ? filled.map((note) => `
          <section class="note ${note.kind}">
            <h2 class="note-label">${note.label}</h2>
            <div class="note-body">${escapeHTML(String(chapter[note.key]).trim())}</div>
          </section>`).join("")
      : `<p class="notes-empty">${NOTES.map((note) => `<span>${note.label}</span>`).join("")}</p>`;

    const plateMarkup = String(chapter.image || "").trim()
      ? `<figure class="plate"><img src="${escapeHTML(String(chapter.image).trim())}" alt="${escapeHTML(clause)} 的意象"></figure>`
      : "";

    page.innerHTML = `
      <article class="chapter">
        <section class="hero">
          <div class="hero-meta">
            <span class="hero-no">${chapter.title}</span>
            <span class="hero-dash" aria-hidden="true"></span>
            <span>${partName(chapter.id)}</span>
          </div>
          <h1 class="hero-clause" data-chars="${[...clause].length}">${escapeHTML(clause)}</h1>
          <div class="hero-rule" aria-hidden="true"></div>
        </section>

        <section class="scripture">
          <div class="scripture-inner">
            <p class="scripture-text">${lines
              .map((line, index) => `<span class="line" style="--i:${index}">${escapeHTML(line)}</span>`)
              .join("")}</p>
          </div>
        </section>

        ${plateMarkup}

        <section class="notes">
          <div class="notes-inner">
            <h2 class="notes-title">札记</h2>
            ${notesMarkup}
          </div>
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
    barPart.textContent = partName(chapter.id);
    footProgress.textContent = `${chapter.title} · 共八十一章`;
    document.title = `${clause} · 道德经`;

    document.querySelectorAll(".toc-row").forEach((row) => {
      row.setAttribute("aria-current", String(Number(row.dataset.id) === chapter.id));
    });
  }

  function buildToc() {
    const row = (chapter) => `
      <a class="toc-row" href="#chapter-${pad(chapter.id)}" data-id="${chapter.id}">
        <span class="toc-row-no">${pad(chapter.id)}</span>
        <span class="toc-row-clause">${escapeHTML(firstClause(chapter.text))}</span>
      </a>`;

    tocBody.innerHTML = `
      <div class="toc-part">上篇 道经 · 一至三十七</div>
      ${chapters.filter((c) => c.id <= 37).map(row).join("")}
      <div class="toc-part">下篇 德经 · 三十八至八十一</div>
      ${chapters.filter((c) => c.id >= 38).map(row).join("")}`;
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

  function goToHash() {
    const chapter = chapterFromHash();
    const expected = `#chapter-${pad(chapter.id)}`;
    if (window.location.hash !== expected) {
      window.history.replaceState(null, "", expected);
    }
    renderChapter(chapter);
    window.scrollTo(0, 0);
    bar.classList.remove("is-scrolled");
  }

  buildToc();
  goToHash();

  window.addEventListener("hashchange", () => {
    if (!toc.hidden) closeToc();
    goToHash();
  });

  window.addEventListener("resize", sizeHero);

  window.addEventListener("scroll", () => {
    bar.classList.toggle("is-scrolled", window.scrollY > 8);
  }, { passive: true });

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
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    if (!toc.hidden) return;
    const tag = document.activeElement && document.activeElement.tagName;
    if (["INPUT", "TEXTAREA", "SELECT"].includes(tag)) return;
    const current = chapterFromHash();
    if (event.key === "ArrowLeft" && current.id > 1) {
      window.location.hash = `chapter-${pad(current.id - 1)}`;
    }
    if (event.key === "ArrowRight" && current.id < chapters.length) {
      window.location.hash = `chapter-${pad(current.id + 1)}`;
    }
  });
})();
