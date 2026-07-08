const state = {
  posts: [],
  filteredPosts: [],
  currentFileName: null,
  previewTimer: null,
  publishPollTimer: null,
  activePublishJobId: null,
  theme: "day",
};

const elements = {
  postList: document.querySelector("#post-list"),
  postSearch: document.querySelector("#post-search"),
  newPostButton: document.querySelector("#new-post-button"),
  editorTitle: document.querySelector("#editor-title"),
  saveButton: document.querySelector("#save-button"),
  publishButton: document.querySelector("#publish-button"),
  clearTerminalButton: document.querySelector("#clear-terminal-button"),
  studioThemeToggle: document.querySelector("#studio-theme-toggle"),
  commitMessage: document.querySelector("#commit-message"),
  gitStatus: document.querySelector("#git-status"),
  terminalOutput: document.querySelector("#terminal-output"),
  previewOutput: document.querySelector("#preview-output"),
  tabButtons: Array.from(document.querySelectorAll(".editor-tab")),
  editorPanes: Array.from(document.querySelectorAll(".editor-pane")),
  title: document.querySelector("#field-title"),
  date: document.querySelector("#field-date"),
  slug: document.querySelector("#field-slug"),
  permalink: document.querySelector("#field-permalink"),
  tags: document.querySelector("#field-tags"),
  excerpt: document.querySelector("#field-excerpt"),
  extra: document.querySelector("#field-extra"),
  content: document.querySelector("#field-content"),
  template: document.querySelector("#post-item-template"),
};

const fields = [
  elements.title,
  elements.date,
  elements.slug,
  elements.permalink,
  elements.tags,
  elements.excerpt,
  elements.extra,
  elements.content,
];

const studioThemeStorageKey = "post-studio-theme";

function resolveStudioTheme() {
  try {
    const stored = window.localStorage.getItem(studioThemeStorageKey);
    if (stored === "day" || stored === "night") {
      return stored;
    }
  } catch (error) {
    // Ignore storage access failure and fall back to system preference.
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "night" : "day";
}

function applyStudioTheme(theme) {
  const nextTheme = theme === "night" ? "night" : "day";
  state.theme = nextTheme;
  document.documentElement.setAttribute("data-theme", nextTheme);

  if (elements.studioThemeToggle) {
    const isNight = nextTheme === "night";
    elements.studioThemeToggle.textContent = isNight ? "Day mode" : "Night mode";
    elements.studioThemeToggle.setAttribute("aria-pressed", isNight ? "true" : "false");
  }

  try {
    window.localStorage.setItem(studioThemeStorageKey, nextTheme);
  } catch (error) {
    // Ignore storage access failure after applying the theme.
  }
}

function slugify(input) {
  return String(input || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function isoToday() {
  return new Date().toISOString().slice(0, 10);
}

function notify(message) {
  window.alert(message);
}

function setActiveEditorTab(tabName) {
  elements.tabButtons.forEach((button) => {
    const isActive = button.dataset.tab === tabName;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", isActive ? "true" : "false");
  });

  elements.editorPanes.forEach((pane) => {
    pane.classList.toggle("is-active", pane.dataset.pane === tabName);
  });
}

function setTerminalOutput(text) {
  elements.terminalOutput.textContent = text;
  elements.terminalOutput.scrollTop = elements.terminalOutput.scrollHeight;
}

function appendTerminalLine(text) {
  const current = elements.terminalOutput.textContent;
  setTerminalOutput(`${current}${current ? "\n" : ""}${text}`);
}

function setPublishingState(isPublishing) {
  elements.publishButton.disabled = isPublishing;
  elements.saveButton.disabled = isPublishing;
  elements.publishButton.textContent = isPublishing ? "Publishing..." : "Commit and push current post";
}

async function request(url, options = {}) {
  const response = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "Request failed");
  }

  return data;
}

function formPayload() {
  return {
    existingFileName: state.currentFileName,
    title: elements.title.value.trim(),
    date: elements.date.value,
    slug: elements.slug.value.trim(),
    permalink: elements.permalink.value.trim(),
    tags: elements.tags.value,
    excerpt: elements.excerpt.value.trim(),
    extraFrontMatterYaml: elements.extra.value,
    content: elements.content.value,
  };
}

function setForm(post) {
  state.currentFileName = post.fileName || null;
  elements.title.value = post.title || "";
  elements.date.value = String(post.date || "").slice(0, 10) || isoToday();
  elements.slug.value = post.fileName ? post.fileName.replace(/^\d{4}-\d{2}-\d{2}-/, "").replace(/\.md$/, "") : "";
  elements.permalink.value = post.permalink || "";
  elements.tags.value = Array.isArray(post.tags) ? post.tags.join(", ") : "";
  elements.excerpt.value = post.excerpt || "";
  elements.extra.value = post.extraFrontMatterYaml || "";
  elements.content.value = post.content || "";
  elements.editorTitle.textContent = post.title || "Untitled draft";
  elements.slug.dataset.autofill = post.fileName ? "false" : "true";
}

function blankPost() {
  return {
    fileName: null,
    title: "",
    date: isoToday(),
    permalink: "",
    tags: [],
    excerpt: "",
    extraFrontMatterYaml: "comments: false\nshare: false",
    content: "# Introduction\n\n",
  };
}

function renderPostList() {
  elements.postList.innerHTML = "";
  const fragment = document.createDocumentFragment();

  state.filteredPosts.forEach((post) => {
    const node = elements.template.content.firstElementChild.cloneNode(true);
    node.querySelector(".post-item__title").textContent = post.title;
    node.querySelector(".post-item__meta").textContent = `${String(post.date).slice(0, 10)}${post.tags?.length ? ` · ${post.tags.join(", ")}` : ""}`;
    if (post.fileName === state.currentFileName) {
      node.classList.add("is-active");
    }
    node.addEventListener("click", () => loadPost(post.fileName));
    fragment.appendChild(node);
  });

  elements.postList.appendChild(fragment);
}

function applySearch() {
  const query = elements.postSearch.value.trim().toLowerCase();
  state.filteredPosts = state.posts.filter((post) => {
    if (!query) {
      return true;
    }
    const haystack = [post.title, post.date, ...(post.tags || [])].join(" ").toLowerCase();
    return haystack.includes(query);
  });
  renderPostList();
}

async function refreshPosts(preferredFileName = state.currentFileName) {
  const data = await request("/api/posts");
  state.posts = data.posts;
  applySearch();

  if (!preferredFileName && state.posts.length) {
    await loadPost(state.posts[0].fileName);
    return;
  }

  if (preferredFileName) {
    const matched = state.posts.find((post) => post.fileName === preferredFileName);
    if (matched) {
      await loadPost(matched.fileName);
      return;
    }
  }

  if (!state.currentFileName) {
    setForm(blankPost());
    schedulePreview();
  }
}

async function loadPost(fileName) {
  const data = await request(`/api/posts/${encodeURIComponent(fileName)}`);
  setForm(data.post);
  renderPostList();
  await updatePreview();
}

async function updatePreview() {
  const payload = formPayload();
  const data = await request("/api/preview", {
    method: "POST",
    body: JSON.stringify({ content: payload.content }),
  });
  elements.previewOutput.innerHTML = data.html;
}

function schedulePreview() {
  window.clearTimeout(state.previewTimer);
  state.previewTimer = window.setTimeout(() => {
    updatePreview().catch((error) => {
      elements.previewOutput.innerHTML = `<p>${error.message}</p>`;
    });
  }, 180);
}

async function saveCurrentPost() {
  if (!elements.title.value.trim()) {
    throw new Error("Title is required before saving.");
  }

  if (!elements.slug.value.trim()) {
    elements.slug.value = slugify(elements.title.value);
  }

  const payload = formPayload();
  const data = await request("/api/save", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  state.currentFileName = data.fileName;
  elements.editorTitle.textContent = elements.title.value.trim();
  await refreshPosts(data.fileName);
  await refreshGitStatus();
  appendTerminalLine(`$ save ${data.fileName}`);
  appendTerminalLine("Saved post file successfully.");
}

async function refreshGitStatus() {
  try {
    const data = await request("/api/git/status");
    elements.gitStatus.textContent = data.status || "Working tree clean.";
  } catch (error) {
    elements.gitStatus.textContent = error.message;
  }
}

async function pollPublishJob(jobId) {
  try {
    const data = await request(`/api/git/publish/${encodeURIComponent(jobId)}`);
    const { job } = data;
    setTerminalOutput(job.output || "");

    if (job.status === "running") {
      state.publishPollTimer = window.setTimeout(() => pollPublishJob(jobId), 900);
      return;
    }

    state.activePublishJobId = null;
    setPublishingState(false);
    await refreshGitStatus();

    if (job.status === "done") {
      notify("Current post committed and push command completed.");
      return;
    }

    notify(job.error || "Publish failed.");
  } catch (error) {
    state.activePublishJobId = null;
    setPublishingState(false);
    appendTerminalLine(`Publish status request failed: ${error.message}`);
    notify(error.message);
  }
}

function wrapSelection(textarea, before, after = before, placeholder = "") {
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const selected = textarea.value.slice(start, end) || placeholder;
  textarea.setRangeText(`${before}${selected}${after}`, start, end, "end");
  textarea.focus();
  schedulePreview();
}

function insertSnippet(type) {
  const textarea = elements.content;
  const snippets = {
    heading: () => wrapSelection(textarea, "## ", "", "Section title"),
    bold: () => wrapSelection(textarea, "**", "**", "bold text"),
    italic: () => wrapSelection(textarea, "*", "*", "emphasis"),
    link: () => wrapSelection(textarea, "[", "](https://example.com)", "link text"),
    code: () => wrapSelection(textarea, "`", "`", "code"),
    quote: () => wrapSelection(textarea, "> ", "", "quoted line"),
    list: () => wrapSelection(textarea, "- ", "", "list item"),
    inlineMath: () => wrapSelection(textarea, "$", "$", "x^2 + y^2"),
    blockMath: () => wrapSelection(textarea, "\n$$\n", "\n$$\n", "\\int_0^1 x^2 \\; dx"),
    frac: () => wrapSelection(textarea, "$\\frac{", "}{denominator}$", "numerator"),
    sum: () => wrapSelection(textarea, "$$\n\\sum_{i=1}^{n} ", "\n$$", "x_i"),
    align: () => wrapSelection(textarea, "$$\n\\begin{aligned}\n", "\n\\end{aligned}\n$$", "a &= b + c \\\\nd &= e + f"),
    matrix: () => wrapSelection(textarea, "$$\n\\begin{bmatrix}\n", "\n\\end{bmatrix}\n$$", "a & b \\\\nc & d"),
    cases: () => wrapSelection(textarea, "$$\nf(x)=\\begin{cases}\n", "\n\\end{cases}\n$$", "x^2, & x > 0 \\\\n0, & x \\le 0"),
  };

  snippets[type]?.();
}

async function publishCurrentPost() {
  await saveCurrentPost();
  const message = elements.commitMessage.value.trim() || `Update ${state.currentFileName}`;
  const data = await request("/api/git/publish", {
    method: "POST",
    body: JSON.stringify({
      message,
      files: [state.currentFileName],
    }),
  });

  state.activePublishJobId = data.job.id;
  setPublishingState(true);
  setTerminalOutput(data.job.output || "$ git publish\n");
  state.publishPollTimer = window.setTimeout(() => pollPublishJob(data.job.id), 250);
}

elements.postSearch.addEventListener("input", applySearch);

elements.newPostButton.addEventListener("click", async () => {
  state.currentFileName = null;
  setForm(blankPost());
  renderPostList();
  setActiveEditorTab("meta");
  await updatePreview();
});

elements.saveButton.addEventListener("click", async () => {
  try {
    await saveCurrentPost();
    notify("Post saved.");
  } catch (error) {
    notify(error.message);
  }
});

elements.publishButton.addEventListener("click", async () => {
  try {
    await publishCurrentPost();
  } catch (error) {
    setPublishingState(false);
    appendTerminalLine(`Publish start failed: ${error.message}`);
    notify(error.message);
    await refreshGitStatus();
  }
});

elements.clearTerminalButton.addEventListener("click", () => {
  setTerminalOutput("");
});

elements.studioThemeToggle?.addEventListener("click", () => {
  applyStudioTheme(state.theme === "night" ? "day" : "night");
});

elements.tabButtons.forEach((button) => {
  button.addEventListener("click", () => {
    setActiveEditorTab(button.dataset.tab);
  });
});

fields.forEach((field) => {
  field.addEventListener("input", () => {
    if (field === elements.title && elements.slug.dataset.autofill === "true") {
      elements.slug.value = slugify(elements.title.value);
      elements.editorTitle.textContent = elements.title.value.trim() || "Untitled draft";
    }

    schedulePreview();
  });
});

elements.slug.addEventListener("input", () => {
  elements.slug.dataset.autofill = "false";
});

document.querySelectorAll("[data-snippet]").forEach((button) => {
  button.addEventListener("click", () => insertSnippet(button.dataset.snippet));
});

window.addEventListener("load", async () => {
  applyStudioTheme(resolveStudioTheme());
  setTerminalOutput("Post Studio ready. Save a post or start a publish job to see service logs here.");
  setActiveEditorTab("meta");
  setForm(blankPost());
  await Promise.all([refreshPosts(), refreshGitStatus()]);
});