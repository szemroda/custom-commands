import { run } from "./exec";

export async function ensureGitRepo() {
  const result = await run("git", ["rev-parse", "--is-inside-work-tree"], {
    allowFailure: true,
  });
  if (result.exitCode !== 0 || result.stdout !== "true") {
    throw new Error("Not inside a git repository.");
  }
}

export async function isWorktreeDirty() {
  const result = await run("git", ["status", "--porcelain"]);
  return result.stdout.length > 0;
}

export async function stageAll() {
  await run("git", ["add", "-A"]);
}

export async function commitAll(message: string) {
  await run("git", ["commit", "-m", message]);
}

export async function getCurrentBranch() {
  const result = await run("git", ["rev-parse", "--abbrev-ref", "HEAD"]);
  return result.stdout;
}

export async function ensureOriginMaster() {
  await run("git", ["fetch", "origin", "master"]);
  const verify = await run("git", ["rev-parse", "--verify", "origin/master"], {
    allowFailure: true,
  });
  if (verify.exitCode !== 0) {
    throw new Error(
      "origin/master not found. Ensure the remote and branch exist."
    );
  }
}

export async function getAheadCount(baseRef: string) {
  const result = await run("git", ["rev-list", "--count", `${baseRef}..HEAD`]);
  const count = Number(result.stdout);
  if (Number.isNaN(count)) {
    throw new Error(`Unable to parse ahead count from: ${result.stdout}`);
  }
  return count;
}

export async function getHeadCommitSubject() {
  const result = await run("git", ["log", "-1", "--pretty=%s"]);
  return result.stdout;
}
