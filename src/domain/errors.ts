// Base of every domain error. Each module narrows `code` to its own union and
// subclasses this, so adapters can recognise any domain error with one check.
export class DomainError<Code extends string = string> extends Error {
  constructor(
    readonly code: Code,
    message: string,
  ) {
    super(message);
    this.name = new.target.name;
  }
}
