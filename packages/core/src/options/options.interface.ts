/**
 * Interface for retrieving configured options
 */
export interface IOptions<T> {
  /**
   * Gets the configured options
   */
  readonly value: T;
}

/**
 * Interface for retrieving named configured options
 */
export interface IOptionsMonitor<T> {
  /**
   * Gets the current configured options
   */
  readonly currentValue: T;
  
  /**
   * Gets a named options instance
   * @param name The name of the options instance
   */
  get(name: string): T;
  
  /**
   * Registers a callback to be invoked when options change
   * @param listener The callback to invoke
   */
  onChange(listener: (options: T, name: string) => void): { dispose: () => void };
}

/**
 * Interface for retrieving options snapshot
 */
export interface IOptionsSnapshot<T> {
  /**
   * Gets the default configured options
   */
  readonly value: T;
  
  /**
   * Gets a named options instance
   * @param name The name of the options instance
   */
  get(name: string): T;
}
