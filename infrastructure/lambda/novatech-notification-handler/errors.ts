export class TransientNotificationError extends Error {
  readonly name = "TransientNotificationError";
  constructor(message = "Notification provider error was transient.") {
    super(message);
  }
}

export class PermanentNotificationError extends Error {
  readonly name = "PermanentNotificationError";
  constructor(message = "Notification provider error was permanent.") {
    super(message);
  }
}

export class NotificationValidationError extends Error {
  readonly name = "NotificationValidationError";
  constructor(message = "Notification message failed validation.") {
    super(message);
  }
}
