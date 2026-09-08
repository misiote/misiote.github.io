/* Kramdown emits math/tex scripts; Markdown prose may also contain delimiters. */
(() => {
  const options = { throwOnError: false, strict: "ignore", trust: false };
  document.querySelectorAll('script[type^="math/tex"]').forEach((source) => {
    const displayMode = source.type.includes("mode=display");
    const target = document.createElement(displayMode ? "div" : "span");
    source.replaceWith(target);
    katex.render(source.textContent, target, { ...options, displayMode });
  });
  document.querySelectorAll(".page__content, .archive__item-excerpt").forEach((element) => {
    renderMathInElement(element, {
      ...options,
      delimiters: [
        { left: "$$", right: "$$", display: true },
        { left: "\\[", right: "\\]", display: true },
        { left: "$", right: "$", display: false },
        { left: "\\(", right: "\\)", display: false },
      ],
      ignoredClasses: ["katex", "katex-display"],
    });
  });
})();
