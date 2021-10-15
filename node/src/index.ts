import path from "path";
import { WorkerManager } from "./WorkerManager";

const workerFile = path.resolve(process.cwd(), "..", "deno", "index.ts");
const socketFile = path.resolve(process.cwd(), "socket.sock");

main();

async function main() {
  const worker = await WorkerManager.create({ workerFile, socketFile });

  console.log(await worker.send({ kind: "Random" }));
  console.log(await worker.send({ kind: "Add", left: 4, right: 78 }));
  console.log(await worker.send({ kind: "Random" }));
  console.log(await worker.send({ kind: "Add", left: 46565, right: 78 }));
  console.log(await worker.send({ kind: "Add", left: 6757656, right: 87877 }));
  console.log(await worker.send({ kind: "Random" }));
  console.log(await worker.send({ kind: "Random" }));
}
