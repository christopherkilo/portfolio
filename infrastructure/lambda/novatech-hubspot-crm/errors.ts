export class TransientFailure extends Error {
  readonly name = "TransientFailure";
  constructor(message = "HubSpot provider error was transient.") {
    super(message);
  }
}

export class PermanentFailure extends Error {
  readonly name = "PermanentFailure";
  constructor(message = "HubSpot provider error was permanent.") {
    super(message);
  }
}
