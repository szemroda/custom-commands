#!/usr/bin/env bun
import { input, select } from "@inquirer/prompts";
import { Command } from "commander";
import { run } from "../src/lib/exec";
import {
  commitAll,
  ensureGitRepo,
  ensureOriginMaster,
  isWorktreeDirty,
  stageAll,
} from "../src/lib/git";

const program = new Command();
program.name("git-feat").argument("[branchName]").parse();

const branchArg = program.args[0];
const branchNameInput =
  branchArg ??
  (await input({
    message: "Feature branch name:",
    validate: (value) =>
      value.trim().length > 0 ? true : "Branch name is required.",
  }));
const branchName = branchNameInput.trim();
if (branchName.length === 0) {
  throw new Error("Branch name is required.");
}

await ensureGitRepo();

const dirty = await isWorktreeDirty();
let action = "";
if (dirty) {
  action = await select({
    message: "Worktree has changes. What do you want to do?",
    choices: [
      { name: "stash (keep changes in stash)", value: "stash" },
      { name: "commit to current branch", value: "commitToCurrent" },
      { name: "move changes to feature branch", value: "moveToFeature" },
      { name: "drop changes", value: "drop" },
    ],
  });

  if (action === "stash") {
    await run("git", ["stash", "push", "-u", "-m", "git-feat auto-stash"]);
  }

  if (action === "commitToCurrent") {
    await stageAll();
    const messageInput = await input({
      message: "Commit message:",
      validate: (value) =>
        value.trim().length > 0 ? true : "Commit message is required.",
    });
    await commitAll(messageInput.trim());
  }

  if (action === "moveToFeature") {
    await run("git", ["stash", "push", "-u", "-m", "git-feat move-to-feature"]);
  }

  if (action === "drop") {
    await run("git", ["reset", "--hard"]);
    await run("git", ["clean", "-fd"]);
  }
}

await ensureOriginMaster();
await run("git", ["checkout", "-b", branchName, "origin/master"]);

if (action === "moveToFeature") {
  const applyResult = await run("git", ["stash", "pop"], {
    allowFailure: true,
  });
  if (applyResult.exitCode !== 0) {
    console.error(
      "Stash pop failed. Resolve conflicts and run `git stash apply` if needed."
    );
  }
}

console.log(`Created and switched to ${branchName} from origin/master.`);
