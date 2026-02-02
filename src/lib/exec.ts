export async function run(
  cmd: string,
  args: string[],
  options?: { cwd?: string; allowFailure?: boolean }
) {
  const proc = Bun.spawn([cmd, ...args], {
    cwd: options?.cwd,
    env: Bun.env,
    stdout: "pipe",
    stderr: "pipe",
  });

  const stdoutPromise = proc.stdout
    ? new Response(proc.stdout).text()
    : Promise.resolve("");
  const stderrPromise = proc.stderr
    ? new Response(proc.stderr).text()
    : Promise.resolve("");
  const [stdout, stderr, exitCode] = await Promise.all([
    stdoutPromise,
    stderrPromise,
    proc.exited,
  ]);

  const result = {
    stdout: stdout.trim(),
    stderr: stderr.trim(),
    exitCode,
  };

  if (exitCode !== 0 && !options?.allowFailure) {
    const commandLabel = [cmd, ...args].join(" ");
    const message = result.stderr.length > 0 ? result.stderr : result.stdout;
    throw new Error(
      `Command failed (${exitCode}): ${commandLabel}\n${message}`
    );
  }

  return result;
}
