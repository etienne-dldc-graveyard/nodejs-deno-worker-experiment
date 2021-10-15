import execa from "execa";
import path from "path";

const denoFilePath = path.resolve(process.cwd(), "deno", "index.ts");
const unixSocketPath = path.resolve(process.cwd(), "socket.sock");

const subprocess = execa(
  `deno`,
  ["run", "--unstable", "--allow-env=JARVIS_UNIX_SOCKET", denoFilePath],
  {
    env: {
      JARVIS_UNIX_SOCKET: unixSocketPath,
    },
  }
);

if (subprocess.stdout) {
  subprocess.stdout.pipe(process.stdout);
}
