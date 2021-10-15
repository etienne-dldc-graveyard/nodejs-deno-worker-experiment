import { decodeMultiple } from "https://deno.land/x/cbor@v1.3.1/decode.js";
import { encode } from "https://deno.land/x/cbor@v1.3.1/encode.js";
import {
  WorkerRequest,
  WorkerRequestInternal,
  WorkerResponse,
  WorkerResponseInternal,
} from "../common/index.ts";

function mergeBuffers(buffer1: Uint8Array, buffer2: Uint8Array): Uint8Array {
  const tmp = new Uint8Array(buffer1.byteLength + buffer2.byteLength);
  tmp.set(new Uint8Array(buffer1), 0);
  tmp.set(new Uint8Array(buffer2), buffer1.byteLength);
  return tmp;
}

export type Handler = (
  request: WorkerRequest
) => Promise<WorkerResponse> | WorkerResponse;

export class Worker {
  static async create(handler: Handler): Promise<Worker> {
    const socketFile = Deno.env.get("JARVIS_UNIX_SOCKET");
    if (!socketFile) {
      throw new Error("No socket path");
    }

    const con = await Deno.connect({ transport: "unix", path: socketFile });

    return new Worker(con, handler);
  }

  private readonly connection: Deno.Conn;

  private incompleteBuffer: Uint8Array | null = null;
  private readonly handler: Handler;

  private async readLoop() {
    while (1) {
      let chunk = new Uint8Array(10);
      await this.connection.read(chunk);
      if (this.incompleteBuffer) {
        chunk = mergeBuffers(this.incompleteBuffer, chunk);
        this.incompleteBuffer = null;
      }
      let values;
      try {
        values = decodeMultiple(chunk);
      } catch (error) {
        if (error.incomplete) {
          this.incompleteBuffer = chunk.slice(error.lastPosition);
          values = error.values;
        } else {
          throw error;
        }
      } finally {
        for (const value of values ?? []) {
          if (value) {
            this.onRequest(value);
          }
        }
      }
    }
  }

  private constructor(connection: Deno.Conn, handler: Handler) {
    this.connection = connection;
    this.handler = handler;
    this.readLoop();
  }

  private async onRequest(req: WorkerRequestInternal): Promise<void> {
    const response = await this.handler(req.request);
    const res: WorkerResponseInternal = {
      id: req.id,
      response,
    };
    this.connection.write(encode(res));
  }
}
