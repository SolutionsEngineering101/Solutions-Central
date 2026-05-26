import { Octokit } from "@octokit/rest";
import matter from "gray-matter";

const octokit = new Octokit({ auth: process.env.GITHUB_PAT });

const OWNER = process.env.GITHUB_REPO_OWNER!;
const REPO = process.env.GITHUB_REPO_NAME!;

// ─── Raw file read ────────────────────────────────────────────────────────────

export async function getFile(path: string): Promise<string | null> {
  try {
    const { data } = await octokit.repos.getContent({ owner: OWNER, repo: REPO, path });
    if ("content" in data) return Buffer.from(data.content, "base64").toString("utf-8");
    return null;
  } catch {
    return null;
  }
}

export async function listFiles(path: string): Promise<string[]> {
  try {
    const { data } = await octokit.repos.getContent({ owner: OWNER, repo: REPO, path });
    if (Array.isArray(data)) return data.filter((f) => f.type === "file").map((f) => f.path);
    return [];
  } catch {
    return [];
  }
}

// ─── Write a file (creates or updates) ───────────────────────────────────────

export async function writeFile(path: string, content: string, message: string): Promise<void> {
  let sha: string | undefined;
  try {
    const { data } = await octokit.repos.getContent({ owner: OWNER, repo: REPO, path });
    if ("sha" in data) sha = data.sha;
  } catch {}

  await octokit.repos.createOrUpdateFileContents({
    owner: OWNER,
    repo: REPO,
    path,
    message,
    content: Buffer.from(content).toString("base64"),
    ...(sha ? { sha } : {}),
  });
}

// ─── JSON helpers ─────────────────────────────────────────────────────────────

export async function getJSON<T>(path: string): Promise<T | null> {
  const raw = await getFile(path);
  if (!raw) return null;
  try { return JSON.parse(raw) as T; } catch { return null; }
}

export async function writeJSON(path: string, data: unknown, message: string): Promise<void> {
  await writeFile(path, JSON.stringify(data, null, 2) + "\n", message);
}

// ─── Markdown helpers ─────────────────────────────────────────────────────────

export async function getMarkdownFiles(dir: string) {
  const paths = await listFiles(dir);
  const mdPaths = paths.filter((p) => p.endsWith(".md"));
  const files = await Promise.all(
    mdPaths.map(async (p) => {
      const raw = await getFile(p);
      if (!raw) return null;
      try {
        const { data: frontmatter, content } = matter(raw);
        return { path: p, frontmatter, content };
      } catch {
        // Malformed YAML frontmatter — return file with empty frontmatter so the page still loads
        return { path: p, frontmatter: {} as Record<string, unknown>, content: raw };
      }
    })
  );
  return files.filter(Boolean) as { path: string; frontmatter: Record<string, unknown>; content: string }[];
}
