import { Octokit } from "@octokit/rest";
import matter from "gray-matter";

const octokit = new Octokit({
  auth: process.env.GITHUB_PAT,
  // Suppress Octokit's internal logger — Next.js dev overlay captures console.error
  // during SSR and surfaces them as issues. 404s for missing directories are expected.
  log: { debug: () => {}, info: () => {}, warn: () => {}, error: () => {} },
});

const OWNER = process.env.GITHUB_REPO_OWNER!;
const REPO = process.env.GITHUB_REPO_NAME!;

// ─── Raw file read ────────────────────────────────────────────────────────────

export async function getFile(path: string): Promise<string | null> {
  try {
    const { data } = await octokit.repos.getContent({ owner: OWNER, repo: REPO, path });
    if ("content" in data) return Buffer.from(data.content, "base64").toString("utf-8");
    return null;
  } catch (err: unknown) {
    if (err && typeof err === "object" && "status" in err && err.status === 404) return null;
    throw err;
  }
}

export async function listFiles(path: string): Promise<string[]> {
  try {
    const { data } = await octokit.repos.getContent({ owner: OWNER, repo: REPO, path });
    if (Array.isArray(data)) return data.filter((f) => f.type === "file").map((f) => f.path);
    return [];
  } catch (err: unknown) {
    // 404 = directory doesn't exist yet, treat as empty
    if (err && typeof err === "object" && "status" in err && err.status === 404) return [];
    throw err;
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

// One GraphQL call fetches the whole directory tree AND every file's text, instead
// of ~1 REST call per file (which exhausted the 5000/hr core rate limit). GraphQL
// uses a separate rate-limit bucket and keeps the data fresh on every render.
const DIR_QUERY = `
query($owner:String!,$repo:String!,$expr:String!){
  repository(owner:$owner,name:$repo){
    object(expression:$expr){
      ... on Tree {
        entries { name type object { ... on Blob { text } } }
      }
    }
  }
}`;

interface TreeEntry { name: string; type: string; object?: { text?: string | null } | null }
interface DirResult { repository?: { object?: { entries?: TreeEntry[] } | null } | null }

export async function getMarkdownFiles(dir: string) {
  const res = await octokit.graphql<DirResult>(DIR_QUERY, {
    owner: OWNER,
    repo: REPO,
    expr: `HEAD:${dir}`,
  });

  const entries = res?.repository?.object?.entries ?? []; // null Tree → dir missing → []
  const files: { path: string; frontmatter: Record<string, unknown>; content: string }[] = [];

  for (const e of entries) {
    if (e.type !== "blob" || !e.name.endsWith(".md")) continue;
    const raw = e.object?.text;
    if (typeof raw !== "string") continue; // binary/oversized → text is null
    try {
      const { data: frontmatter, content } = matter(raw);
      files.push({ path: `${dir}/${e.name}`, frontmatter, content });
    } catch {
      // Malformed YAML frontmatter — keep the file so the page still loads
      files.push({ path: `${dir}/${e.name}`, frontmatter: {}, content: raw });
    }
  }
  return files;
}

// ─── Commit activity (who pushed what) ─────────────────────────────────────────

export interface CommitInfo {
  sha: string;
  message: string;      // first line
  fullMessage: string;
  author: string;       // git author name (the real person)
  login: string | null; // GitHub login if resolvable
  avatarUrl: string | null;
  date: string;
}

export async function listCommits(limit = 40): Promise<CommitInfo[]> {
  const { data } = await octokit.repos.listCommits({ owner: OWNER, repo: REPO, per_page: Math.min(limit, 100) });
  return data.map((c) => ({
    sha: c.sha,
    message: c.commit.message.split("\n")[0],
    fullMessage: c.commit.message,
    author: c.commit.author?.name ?? c.author?.login ?? "Unknown",
    login: c.author?.login ?? null,
    avatarUrl: c.author?.avatar_url ?? null,
    date: c.commit.author?.date ?? "",
  }));
}

export async function getCommitFiles(sha: string): Promise<{
  files: { filename: string; status: string; additions: number; deletions: number }[];
  additions: number;
  deletions: number;
}> {
  const { data } = await octokit.repos.getCommit({ owner: OWNER, repo: REPO, ref: sha });
  return {
    files: (data.files ?? []).map((f) => ({
      filename: f.filename, status: f.status, additions: f.additions ?? 0, deletions: f.deletions ?? 0,
    })),
    additions: data.stats?.additions ?? 0,
    deletions: data.stats?.deletions ?? 0,
  };
}
