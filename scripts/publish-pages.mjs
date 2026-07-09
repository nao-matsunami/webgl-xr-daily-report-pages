import { promises as fs } from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { Buffer } from "node:buffer";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(scriptDir, "..");
const configPath = path.join(rootDir, "pages.config.json");

async function pathExists(targetPath) {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

async function ensureDir(targetPath) {
  await fs.mkdir(targetPath, { recursive: true });
}

function run(command, args, cwd) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      stdio: "inherit"
    });

    child.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${command} ${args.join(" ")} failed with code ${code}`));
    });
  });
}

function runCapture(command, args, cwd) {
  return new Promise((resolve, reject) => {
    let stdout = "";
    let stderr = "";

    const child = spawn(command, args, {
      cwd,
      stdio: ["ignore", "pipe", "pipe"]
    });

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    child.on("exit", (code) => {
      if (code === 0) resolve(stdout.trim());
      else reject(new Error(stderr.trim() || `${command} ${args.join(" ")} failed with code ${code}`));
    });
  });
}

async function loadConfig() {
  const raw = JSON.parse(await fs.readFile(configPath, "utf8"));

  if (typeof raw.pagesRepoUrl !== "string" || !raw.pagesRepoUrl.trim()) {
    throw new Error(`Invalid pagesRepoUrl in ${configPath}`);
  }

  return {
    pagesRepoUrl: raw.pagesRepoUrl,
    pagesCloneDir:
      typeof raw.pagesCloneDir === "string" && raw.pagesCloneDir.trim()
        ? raw.pagesCloneDir
        : ".pages-repo"
  };
}

function normalizeGitUrl(url) {
  return String(url || "")
    .trim()
    .replace(/\.git$/, "")
    .replace(/^git@github\.com:/, "https://github.com/")
    .replace(/^http:\/\//, "https://");
}

async function getOriginUrl(cwd) {
  try {
    return await runCapture("git", ["config", "--get", "remote.origin.url"], cwd);
  } catch {
    return "";
  }
}

async function copyRecursive(from, to, skipNames) {
  const stat = await fs.lstat(from);

  if (stat.isDirectory()) {
    await ensureDir(to);
    const entries = await fs.readdir(from, { withFileTypes: true });
    for (const entry of entries) {
      if (skipNames.has(entry.name)) continue;
      await copyRecursive(path.join(from, entry.name), path.join(to, entry.name), skipNames);
    }
    return;
  }

  await ensureDir(path.dirname(to));
  await fs.copyFile(from, to);
}

async function emptyTargetDir(targetPath, skipNames) {
  const entries = await fs.readdir(targetPath, { withFileTypes: true });
  for (const entry of entries) {
    if (skipNames.has(entry.name)) continue;
    await fs.rm(path.join(targetPath, entry.name), { recursive: true, force: true });
  }
}

async function ensurePagesClone(targetDir, repoUrl) {
  const hasGit = await pathExists(path.join(targetDir, ".git"));
  if (hasGit) return;

  await ensureDir(path.dirname(targetDir));
  await run("git", ["clone", repoUrl, targetDir], rootDir);
}

async function copyProject(sourceDir, targetDir) {
  const skipSourceNames = new Set([".git", "node_modules", ".pages-repo"]);
  const skipTargetNames = new Set([".git"]);

  await ensureDir(targetDir);
  await emptyTargetDir(targetDir, skipTargetNames);

  const entries = await fs.readdir(sourceDir, { withFileTypes: true });
  for (const entry of entries) {
    if (skipSourceNames.has(entry.name)) continue;

    const from = path.join(sourceDir, entry.name);
    const to = path.join(targetDir, entry.name);

    await copyRecursive(from, to, skipSourceNames);
  }
}

async function publishInPlace(repoDir) {
  await run("node", ["scripts/build-gallery.mjs"], repoDir);
  await run("git", ["add", "."], repoDir);

  let hasChanges = true;
  try {
    await run("git", ["diff", "--cached", "--quiet"], repoDir);
    hasChanges = false;
  } catch {
    hasChanges = true;
  }

  if (!hasChanges) {
    console.log("No changes to publish.");
    return;
  }

  const stamp = new Date().toISOString().slice(0, 16).replace("T", " ");
  await run("git", ["commit", "-m", `Publish daily update ${stamp}`], repoDir);
  const token = await runCapture("gh", ["auth", "token"], repoDir);
  const basic = Buffer.from(`x-access-token:${token}`).toString("base64");
  const gitPushArgs = ["-c", `http.https://github.com/.extraheader=AUTHORIZATION: basic ${basic}`];

  try {
    await run("git", [...gitPushArgs, "push", "origin", "main"], repoDir);
  } catch {
    await run("git", [...gitPushArgs, "fetch", "origin", "main"], repoDir);
    await run("git", ["rebase", "origin/main"], repoDir);
    await run("git", [...gitPushArgs, "push", "origin", "main"], repoDir);
  }
}

async function main() {
  const { pagesRepoUrl, pagesCloneDir } = await loadConfig();
  const currentOriginUrl = normalizeGitUrl(await getOriginUrl(rootDir));
  const configuredOriginUrl = normalizeGitUrl(pagesRepoUrl);

  if (currentOriginUrl && currentOriginUrl === configuredOriginUrl) {
    await publishInPlace(rootDir);
    return;
  }

  const targetDir = path.resolve(rootDir, pagesCloneDir);
  await ensurePagesClone(targetDir, pagesRepoUrl);
  await copyProject(rootDir, targetDir);
  await publishInPlace(targetDir);
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
