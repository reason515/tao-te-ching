(() => {
  const chapters = window.TAO_CHAPTERS || [];
  const page = document.getElementById("chapter-page");
  const daoList = document.getElementById("dao-list");
  const deList = document.getElementById("de-list");
  const menuToggle = document.getElementById("menu-toggle");
  const chapterIndex = document.getElementById("chapter-index");
  const footerProgress = document.getElementById("footer-progress");

  const pad = (number) => String(number).padStart(2, "0");
  const escapeHTML = (value) => String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[character]);

  function buildChapterLinks() {
    const makeLink = (chapter) => `
      <a class="chapter-link" href="#chapter-${pad(chapter.id)}" data-chapter-link="${chapter.id}"
         aria-label="${chapter.part} ${chapter.title}">${pad(chapter.id)}</a>`;
    daoList.innerHTML = chapters.filter((chapter) => chapter.id <= 37).map(makeLink).join("");
    deList.innerHTML = chapters.filter((chapter) => chapter.id >= 38).map(makeLink).join("");
  }

  function getChapterFromHash() {
    const match = window.location.hash.match(/^#chapter-(\d{2})$/);
    const id = match ? Number(match[1]) : 1;
    return chapters.find((chapter) => chapter.id === id) || chapters[0];
  }

  function reflectionCard(label, number, content) {
    return `
      <article class="reflection-card">
        <h3><span class="note-index">${number}</span>${label}</h3>
        <div class="reflection-content">${content ? escapeHTML(content) : ""}</div>
      </article>`;
  }

  function renderChapter(chapter) {
    const previous = chapters.find((item) => item.id === chapter.id - 1);
    const next = chapters.find((item) => item.id === chapter.id + 1);
    const partLabel = chapter.id <= 37 ? "上篇 · 道经" : "下篇 · 德经";
    const imageMarkup = chapter.image
      ? `<div class="image-well"><img src="${escapeHTML(chapter.image)}" alt="${escapeHTML(chapter.title)}配图"></div>`
      : `<div class="image-well is-empty" role="img" aria-label="${escapeHTML(chapter.title)}的配图区域"></div>`;

    page.innerHTML = `
      <article class="chapter-page" aria-labelledby="chapter-title">
        <header class="chapter-heading" id="chapter-heading">
          <div>
            <div class="chapter-kicker">
              <span class="part-name">${partLabel}</span>
              <span>王弼本 · ${chapter.title}</span>
            </div>
            <h1 id="chapter-title"><span class="chapter-number">${pad(chapter.id)}</span>${escapeHTML(chapter.title)}</h1>
          </div>
          <div class="chapter-position"><strong>${pad(chapter.id)}</strong> / 81</div>
        </header>

        <div class="chapter-hero">
          <section class="scripture" aria-labelledby="scripture-heading">
            <h2 class="section-label" id="scripture-heading">本章原文</h2>
            <p class="scripture-text">${escapeHTML(chapter.text)}</p>
          </section>
          <figure class="artwork-figure">
            ${imageMarkup}
            <figcaption><span>本章意象</span><span>${pad(chapter.id)} · 81</span></figcaption>
          </figure>
        </div>

        <section class="reflection-section" aria-labelledby="reflection-heading">
          <div class="reflection-heading">
            <h2 id="reflection-heading">解读与札记</h2>
            <p>读其文 · 观其意 · 记所得</p>
          </div>
          <div class="reflection-grid">
            ${reflectionCard("AI 解读", "01", chapter.aiInterpretation)}
            ${reflectionCard("个人理解", "02", chapter.personalUnderstanding)}
            ${reflectionCard("与人共读", "03", chapter.sharedReading)}
            ${reflectionCard("与 AI 对谈", "04", chapter.aiDialogue)}
          </div>
        </section>

        <nav class="chapter-controls" aria-label="章节翻页">
          <button class="chapter-control previous" type="button" data-target="${previous ? previous.id : ""}" ${previous ? "" : "disabled"}>
            <span class="control-direction"><span class="control-arrow" aria-hidden="true">←</span> 上一章</span>
            <span class="control-title">${previous ? escapeHTML(previous.title) : "篇首"}</span>
          </button>
          <button class="chapter-control next" type="button" data-target="${next ? next.id : ""}" ${next ? "" : "disabled"}>
            <span class="control-direction">下一章 <span class="control-arrow" aria-hidden="true">→</span></span>
            <span class="control-title">${next ? escapeHTML(next.title) : "篇末"}</span>
          </button>
        </nav>
      </article>`;

    document.querySelectorAll("[data-chapter-link]").forEach((link) => {
      const active = Number(link.dataset.chapterLink) === chapter.id;
      if (active) link.setAttribute("aria-current", "page");
      else link.removeAttribute("aria-current");
    });
    footerProgress.textContent = `${pad(chapter.id)} / 81 · ${partLabel}`;
    document.title = `${chapter.title} · 道德经`;

    page.querySelectorAll(".chapter-control[data-target]").forEach((button) => {
      if (button.disabled) return;
      button.addEventListener("click", () => {
        window.location.hash = `chapter-${pad(Number(button.dataset.target))}`;
      });
    });
  }

  function navigateToCurrentHash() {
    const chapter = getChapterFromHash();
    const expectedHash = `#chapter-${pad(chapter.id)}`;
    if (window.location.hash !== expectedHash) {
      window.history.replaceState(null, "", expectedHash);
    }
    renderChapter(chapter);
  }

  buildChapterLinks();
  navigateToCurrentHash();
  window.addEventListener("hashchange", () => {
    navigateToCurrentHash();
    window.scrollTo({ top: 0, behavior: "smooth" });
    chapterIndex.classList.remove("is-open");
    menuToggle.setAttribute("aria-expanded", "false");
  });

  menuToggle.addEventListener("click", () => {
    const isOpen = chapterIndex.classList.toggle("is-open");
    menuToggle.setAttribute("aria-expanded", String(isOpen));
  });

  document.addEventListener("keydown", (event) => {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    if (["INPUT", "TEXTAREA", "SELECT", "BUTTON", "A"].includes(document.activeElement.tagName)) return;
    if (event.key === "ArrowLeft" && getChapterFromHash().id > 1) {
      window.location.hash = `chapter-${pad(getChapterFromHash().id - 1)}`;
    }
    if (event.key === "ArrowRight" && getChapterFromHash().id < chapters.length) {
      window.location.hash = `chapter-${pad(getChapterFromHash().id + 1)}`;
    }
  });
})();
