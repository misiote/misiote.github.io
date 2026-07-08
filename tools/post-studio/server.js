const fs = require("fs");
const path = require("path");
const matter = require("gray-matter");
const yaml = require("js-yaml");
const express = require("express");
const { spawn, spawnSync } = require("child_process");
const MarkdownIt = require("markdown-it");
const markdownItAttrs = require("markdown-it-attrs");
const markdownItFootnote = require("markdown-it-footnote");
const texmath = require("markdown-it-texmath");
const katex = require("katex");

const app = express();
const repoRoot = path.resolve(__dirname, "..", "..");
const postsDir = path.join(repoRoot, "_posts");
const publicDir = path.join(__dirname, "public");
const port = Number(process.env.POST_STUDIO_PORT || 4310);
const publishJobs = new Map();

const markdown = new MarkdownIt({
  html: false,
  linkify: true,
  typographer: true,
})
  .use(markdownItAttrs)
  .use(markdownItFootnote)
  .use(texmath, {
    engine: katex,
    delimiters: "dollars",
    katexOptions: { throwOnError: false, strict: "ignore" },
  });

app.use(express.json({ limit: "2mb" }));
app.use(express.static(publicDir));
app.use("/vendor/katex", express.static(path.join(repoRoot, "node_modules", "katex", "dist")));

function normalizeTags(tags) {
  if (!tags) {
    return [];
  }

  if (Array.isArray(tags)) {
    return tags.map((tag) => String(tag).trim()).filter(Boolean);
  }

  return String(tags)
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
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

function ensureIsoDate(value) {
  const raw = String(value || "").trim();
  if (!raw) {
    throw new Error("Date is required.");
  }

  const matched = raw.match(/^(\d{4}-\d{2}-\d{2})/);
  if (!matched) {
    throw new Error("Date must start with YYYY-MM-DD.");
  }

  return matched[1];
}

function buildFileName(dateValue, slug) {
  return `${dateValue}-${slug}.md`;
}

function postPathFromFileName(fileName) {
  const safeName = path.basename(String(fileName || ""));
  return path.join(postsDir, safeName);
}

function parsePostFile(fileName) {
  const filePath = postPathFromFileName(fileName);
  const raw = fs.readFileSync(filePath, "utf8");
  const parsed = matter(raw);
  const data = parsed.data || {};
  const tags = normalizeTags(data.tags);
  const knownKeys = new Set(["title", "date", "permalink", "tags", "layout", "excerpt"]);
  const extraData = {};

  Object.entries(data).forEach(([key, value]) => {
    if (!knownKeys.has(key)) {
      extraData[key] = value;
    }
  });

  return {
    fileName,
    title: data.title || "",
    date: data.date || "",
    permalink: data.permalink || "",
    layout: data.layout || "single",
    excerpt: data.excerpt || "",
    tags,
    extraFrontMatterYaml: Object.keys(extraData).length ? yaml.dump(extraData, { lineWidth: 120 }).trim() : "",
    content: parsed.content.replace(/^\n/, ""),
    htmlPreview: markdown.render(parsed.content || ""),
    updatedAt: fs.statSync(filePath).mtime.toISOString(),
  };
}

function listPostFiles() {
  return fs
    .readdirSync(postsDir)
    .filter((fileName) => fileName.endsWith(".md"))
    .sort()
    .reverse();
}

function parseExtraFrontMatter(extraFrontMatterYaml) {
  const raw = String(extraFrontMatterYaml || "").trim();
  if (!raw) {
    return {};
  }

  const parsed = yaml.load(raw);
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("Extra front matter must be a YAML object.");
  }

  return parsed;
}

function serializePostPayload(payload) {
  const slug = slugify(payload.slug || payload.title);
  if (!slug) {
    throw new Error("Title or slug is required.");
  }

  const isoDate = ensureIsoDate(payload.date);
  const fileName = buildFileName(isoDate, slug);
  const extraData = parseExtraFrontMatter(payload.extraFrontMatterYaml);
  const frontMatter = {
    title: payload.title,
    date: isoDate,
    permalink: payload.permalink || `/posts/${isoDate.slice(0, 4)}/${isoDate.slice(5, 7)}/${slug}/`,
    tags: normalizeTags(payload.tags),
    layout: payload.layout || "single",
    ...extraData,
  };

  if (payload.excerpt) {
    frontMatter.excerpt = payload.excerpt;
  }

  const fileBody = matter.stringify(String(payload.content || "").trimEnd() + "\n", frontMatter);
  return { fileName, fileBody, slug, isoDate, frontMatter };
}

function runGit(args) {
  const result = spawnSync("git", args, {
    cwd: repoRoot,
    encoding: "utf8",
    env: {
      ...process.env,
      GIT_TERMINAL_PROMPT: "0",
      GCM_INTERACTIVE: "Never",
    },
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    throw new Error((result.stderr || result.stdout || "Git command failed").trim());
  }

  return (result.stdout || "").trim();
}

function currentBranch() {
  return runGit(["branch", "--show-current"]) || "master";
}

function createJob(commandLabel) {
  const job = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    status: "running",
    commandLabel,
    output: `Post Studio publish job started at ${new Date().toLocaleString()}\n`,
    error: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  publishJobs.set(job.id, job);
  return job;
}

function touchJob(job) {
  job.updatedAt = new Date().toISOString();
}

function appendJobOutput(job, text) {
  if (!text) {
    return;
  }

  job.output += text;
  if (job.output.length > 50000) {
    job.output = job.output.slice(-50000);
  }
  touchJob(job);
}

function serializeJob(job) {
  return {
    id: job.id,
    status: job.status,
    commandLabel: job.commandLabel,
    output: job.output,
    error: job.error,
    createdAt: job.createdAt,
    updatedAt: job.updatedAt,
  };
}

function lastMeaningfulGitLine(output) {
  return String(output || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(-1)[0];
}

function runGitStream(args, job, options = {}) {
  const { allowFailure = false } = options;

  return new Promise((resolve, reject) => {
    appendJobOutput(job, `\n$ git ${args.join(" ")}\n`);

    const child = spawn("git", args, {
      cwd: repoRoot,
      env: {
        ...process.env,
        GIT_TERMINAL_PROMPT: "0",
        GCM_INTERACTIVE: "Never",
      },
      stdio: ["ignore", "pipe", "pipe"],
    });

    let combinedOutput = "";

    child.stdout.on("data", (chunk) => {
      const text = chunk.toString();
      combinedOutput += text;
      appendJobOutput(job, text);
    });

    child.stderr.on("data", (chunk) => {
      const text = chunk.toString();
      combinedOutput += text;
      appendJobOutput(job, text);
    });

    child.on("error", (error) => {
      appendJobOutput(job, `${error.message}\n`);
      reject(error);
    });

    child.on("close", (code) => {
      if (code === 0 || allowFailure) {
        resolve({ code, output: combinedOutput });
        return;
      }

      reject(new Error(lastMeaningfulGitLine(combinedOutput) || `git ${args[0]} failed with exit code ${code}`));
    });
  });
}

async function runPublishJob(job, message, files) {
  const trackedFiles = files.map((fileName) => `_posts/${fileName}`);
  const branch = currentBranch();

  try {
    await runGitStream(["add", ...trackedFiles], job);
    const staged = await runGitStream(["diff", "--cached", "--name-only", "--", ...trackedFiles], job);

    if (staged.output.trim()) {
      const commitResult = await runGitStream(["commit", "-m", message], job, { allowFailure: true });
      if (/nothing to commit/i.test(commitResult.output)) {
        appendJobOutput(job, "No new commit was created because the selected post already matched HEAD.\n");
      }
    } else {
      appendJobOutput(job, "No new staged changes were found for the selected post. Skipping commit and trying push anyway.\n");
    }

    await runGitStream(["push", "--porcelain", "origin", branch], job);
    job.status = "done";
    appendJobOutput(job, `\nPublish completed successfully on branch ${branch}.\n`);
    touchJob(job);
  } catch (error) {
    job.status = "failed";
    job.error = error.message;
    appendJobOutput(job, `\nPublish failed: ${error.message}\n`);
    touchJob(job);
  }
}

app.get("/api/posts", (_req, res) => {
  const posts = listPostFiles().map((fileName) => {
    const post = parsePostFile(fileName);
    return {
      fileName: post.fileName,
      title: post.title || fileName,
      date: post.date,
      tags: post.tags,
      updatedAt: post.updatedAt,
    };
  });

  res.json({ posts });
});

app.get("/api/posts/:fileName", (req, res) => {
  try {
    res.json({ post: parsePostFile(req.params.fileName) });
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
});

app.post("/api/preview", (req, res) => {
  try {
    const html = markdown.render(String(req.body.content || ""));
    res.json({ html });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post("/api/save", (req, res) => {
  try {
    const existingFileName = req.body.existingFileName ? String(req.body.existingFileName) : null;
    const { fileName, fileBody } = serializePostPayload(req.body);
    const nextPath = postPathFromFileName(fileName);

    if (existingFileName && existingFileName !== fileName) {
      const previousPath = postPathFromFileName(existingFileName);
      if (fs.existsSync(previousPath)) {
        fs.unlinkSync(previousPath);
      }
    }

    fs.writeFileSync(nextPath, fileBody, "utf8");
    res.json({ ok: true, fileName });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get("/api/git/status", (_req, res) => {
  try {
    const status = runGit(["status", "--short"]);
    res.json({ status });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/git/publish", (req, res) => {
  try {
    const message = String(req.body.message || "Update post").trim();
    const files = Array.isArray(req.body.files) ? req.body.files : [];
    if (!files.length) {
      throw new Error("Choose at least one post file to publish.");
    }

    const activeJob = Array.from(publishJobs.values()).find((job) => job.status === "running");
    if (activeJob) {
      throw new Error("Another publish job is already running. Wait for it to finish before starting a new one.");
    }

    const job = createJob(`git publish ${files.join(", ")}`);
    runPublishJob(job, message, files);
    res.json({ ok: true, job: serializeJob(job) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/git/publish/:jobId", (req, res) => {
  const job = publishJobs.get(String(req.params.jobId || ""));
  if (!job) {
    res.status(404).json({ error: "Publish job not found." });
    return;
  }

  res.json({ job: serializeJob(job) });
});

app.get("/", (_req, res) => {
  res.sendFile(path.join(publicDir, "index.html"));
});

app.listen(port, () => {
  console.log(`Post Studio running at http://localhost:${port}`);
});