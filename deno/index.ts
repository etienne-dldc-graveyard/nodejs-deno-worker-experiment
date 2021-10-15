import { Worker } from "./Worker.ts";

await Worker.create((request) => {
  if (request.kind === "Random") {
    return { kind: "Success", value: Math.random() };
  }
  if (request.kind === "Add") {
    return { kind: "Success", value: request.left + request.right };
  }
  return { kind: "Error" };
});
