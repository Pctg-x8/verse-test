import { callMultipleActions, callMultipleFunctions } from ".";
import { CleanupFunction } from "../systemComponents/Renderer";

export class UnorderedSignal {
  private observers = new Set<() => void>();

  observe(handler: () => void): CleanupFunction {
    this.observers.add(handler);
    return () => this.observers.delete(handler);
  }

  signal() {
    callMultipleActions(...this.observers);
  }
}
export class ReadonlyReactiveValue<T> {
  protected observers = new Set<(value: T) => void>();

  constructor(protected _value: T) {}

  observe(handler: (value: T) => void): CleanupFunction {
    this.observers.add(handler);
    handler(this.value);
    return () => this.observers.delete(handler);
  }

  get value() {
    return this._value;
  }
}
export class ReactiveValue<T> extends ReadonlyReactiveValue<T> {
  constructor(init: T) {
    super(init);
  }

  get value() {
    return this._value;
  }

  set value(value: T) {
    this._value = value;
    callMultipleFunctions(value)(...this.observers);
  }

  update(updater: (old: T) => T) {
    this.value = updater(this.value);
  }

  get asReadonly(): ReadonlyReactiveValue<T> {
    return this;
  }
}
