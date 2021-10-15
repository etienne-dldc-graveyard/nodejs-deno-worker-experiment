import fs from "fs";
import execa from "execa";
import { createServer, Socket } from "net";
import { Decoder, encode } from "cbor";
import {
  WorkerRequest,
  WorkerRequestInternal,
  WorkerResponse,
  WorkerResponseInternal,
} from "../../common/index";
import { nanoid } from "nanoid";
import {
  ControllablePromise,
  createControllablePromise,
} from "./ControllablePromise";

export type WorkerManagerOptions = {
  workerFile: string;
  socketFile: string;
};

export class WorkerManager {
  static create({
    workerFile,
    socketFile,
  }: WorkerManagerOptions): Promise<WorkerManager> {
    return new Promise((resolve, _reject) => {
      const unixSocketServer = createServer();

      fs.unlinkSync(socketFile);

      unixSocketServer.listen(socketFile, () => {
        const process = execa(
          `deno`,
          [
            "run",
            "--unstable",
            "--allow-env=JARVIS_UNIX_SOCKET",
            `--allow-read=${socketFile}`,
            `--allow-write=${socketFile}`,
            `--allow-net`,
            workerFile,
          ],
          { env: { JARVIS_UNIX_SOCKET: socketFile } }
        );

        unixSocketServer.on("connection", (socket) => {
          resolve(new WorkerManager(process, socket));
        });

        // if (subprocess.stdout && subprocess.stderr) {
        //   subprocess.stdout.pipe(process.stdout);
        //   subprocess.stderr.pipe(process.stderr);
        // }
      });
    });
  }

  private readonly socket: Socket;
  private readonly process: execa.ExecaChildProcess<string>;
  private readonly requests = new Map<
    string,
    ControllablePromise<WorkerResponse>
  >();

  private constructor(
    process: execa.ExecaChildProcess<string>,
    socket: Socket
  ) {
    this.process = process;
    this.socket = socket;
    const decoder = new Decoder();
    decoder.on("data", (obj) => {
      this.onResponse(obj);
    });
    socket.pipe(decoder);
  }

  private onResponse(res: WorkerResponseInternal) {
    const req = this.requests.get(res.id);
    if (!req) {
      return;
    }
    this.requests.delete(res.id);
    req.resolve(res.response);
  }

  send(request: WorkerRequest): Promise<WorkerResponse> {
    const id = nanoid();
    const req = createControllablePromise<WorkerResponse>(() => {
      const req: WorkerRequestInternal = {
        id,
        request,
      };
      this.socket.write(encode(req));
    });
    this.requests.set(id, req);
    return req.promise;
  }

  kill() {
    return this.process.kill();
  }
}
