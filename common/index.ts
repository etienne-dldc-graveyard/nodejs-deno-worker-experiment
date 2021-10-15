export type WorkerRequest =
  | {
      kind: "Random";
    }
  | { kind: "Add"; left: number; right: number };

export type WorkerRequestInternal = {
  id: string;
  request: WorkerRequest;
};

export type WorkerResponse =
  | {
      kind: "Success";
      value: number;
    }
  | { kind: "Error" };

export type WorkerResponseInternal = {
  id: string;
  response: WorkerResponse;
};
