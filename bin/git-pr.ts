#!/usr/bin/env bun
import { input } from "@inquirer/prompts";
import { run } from "../src/lib/exec";
import {
  commitAll,
  ensureGitRepo,
  ensureOriginMaster,
  getAheadCount,
  getCurrentBranch,
  getHeadCommitSubject,
  isWorktreeDirty,
  stageAll,
} from "../src/lib/git";

const getErrorMessage = (error: unknown) => {
  if (error instanceof Error) {
    if (error.name === "ExitPromptError") {
      return "Prompt cancelled.";
    }
    return error.message;
  }
  return String(error);
};

const main = async () => {
  await ensureGitRepo();

  const currentBranch = await getCurrentBranch();
  if (currentBranch === "master" || currentBranch === "main") {
    throw new Error(
      `git-pr cannot run on ${currentBranch}. Create a feature branch first.`
    );
  }

  const dirty = await isWorktreeDirty();
  if (dirty) {
    await stageAll();
    const messageInput = await input({
      message: "Commit message:",
      validate: (value) =>
        value.trim().length > 0 ? true : "Commit message is required.",
    });
    await commitAll(messageInput.trim());
  }

  await run("git", ["push", "-u", "origin", "HEAD"]);
  await ensureOriginMaster();

  const aheadCount = await getAheadCount("origin/master");
  if (aheadCount === 0) {
    throw new Error(
      `Branch ${currentBranch} has no commits ahead of origin/master.`
    );
  }

  let title = "";
  if (aheadCount === 1) {
    title = await getHeadCommitSubject();
  } else {
    const titleInput = await input({
      message: "Pull request title:",
      validate: (value) =>
        value.trim().length > 0 ? true : "Pull request title is required.",
    });
    title = titleInput.trim();
  }

  const createResult = await run(
    "gh",
    ["pr", "create", "--title", title, "--body", "", "--base", "master"],
    { allowFailure: true }
  );

  if (createResult.exitCode !== 0) {
    const output =
      `${createResult.stdout}\n${createResult.stderr}`.toLowerCase();
    const alreadyExists =
      output.includes("already exists") ||
      output.includes("existing pull request") ||
      output.includes("a pull request already exists");
    if (!alreadyExists) {
      const commandLabel = "gh pr create";
      throw new Error(
        `Command failed: ${commandLabel}\n${createResult.stderr}`
      );
    }
  }

  await run("gh", ["pr", "view", "--web"]);
};

main().catch((error) => {
  console.error(`error: ${getErrorMessage(error)}`);
  process.exitCode = 1;
});
