import type { IOptions, IOptionsMonitor, IOptionsSnapshot } from "./options.interface.js";

/**
 * Default implementation of IOptions<T>
 */
export class Options<T> implements IOptions<T> {
  /**
   * Creates a new instance of Options
   * @param options The options instance
   */
  constructor(private readonly options: T) {}

  /**
   * Gets the configured options
   */
  public get value(): T {
    return this.options;
  }
}

/**
 * Default implementation of IOptionsMonitor<T>
 */
export class OptionsMonitor<T> implements IOptionsMonitor<T> {
  private readonly _onChangeListeners: Array<(options: T, name: string) => void> = [];
  private readonly _cache: Map<string, T> = new Map<string, T>();

  /**
   * Creates a new instance of OptionsMonitor
   * @param factory Factory for creating the options
   * @param defaultName Default name for the options
   */
  constructor(
    private readonly factory: (name: string) => T,
    private readonly defaultName: string = ""
  ) {
    // Initialize the default instance
    this._cache.set(this.defaultName, this.factory(this.defaultName));
  }

  /**
   * Gets the current configured options
   */
  public get currentValue(): T {
    return this.get(this.defaultName);
  }

  /**
   * Gets a named options instance
   * @param name The name of the options instance
   */
  public get(name: string): T {
    const optionsName = name || this.defaultName;
    
    if (!this._cache.has(optionsName)) {
      this._cache.set(optionsName, this.factory(optionsName));
    }
    
    return this._cache.get(optionsName)!;
  }

  /**
   * Registers a callback to be invoked when options change
   * @param listener The callback to invoke
   */
  public onChange(listener: (options: T, name: string) => void): { dispose: () => void } {
    this._onChangeListeners.push(listener);
    
    return {
      dispose: () => {
        const index = this._onChangeListeners.indexOf(listener);
        if (index >= 0) {
          this._onChangeListeners.splice(index, 1);
        }
      }
    };
  }

  /**
   * Invokes the registered callbacks when options change
   * @param name The name of the options that changed
   * @param options The new options instance
   */
  public invokeChanged(name: string, options: T): void {
    // Update the cache
    this._cache.set(name, options);
    
    // Notify the listeners
    for (const listener of this._onChangeListeners) {
      try {
        listener(options, name);
      } catch (ex) {
        console.error(`Error in options change listener: ${ex}`);
      }
    }
  }
}

/**
 * Default implementation of IOptionsSnapshot<T>
 */
export class OptionsSnapshot<T> implements IOptionsSnapshot<T> {
  /**
   * Creates a new instance of OptionsSnapshot
   * @param factory Factory for creating the options
   * @param defaultName Default name for the options
   */
  constructor(
    private readonly factory: (name: string) => T,
    private readonly defaultName: string = ""
  ) {}

  /**
   * Gets the default configured options
   */
  public get value(): T {
    return this.get(this.defaultName);
  }

  /**
   * Gets a named options instance
   * @param name The name of the options instance
   */
  public get(name: string): T {
    return this.factory(name || this.defaultName);
  }
}
