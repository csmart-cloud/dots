/**
 * Interface for HTTP response handling
 */
export interface IHttpResponse {
  /** HTTP status code */
  statusCode: number;
  
  /** Flag indicating if the response has been sent */
  readonly isSent: boolean;
  
  /** Content type header of the response */
  contentType?: string;
  
  /**
   * Sets an HTTP header
   * @param name Header name
   * @param value Header value
   */
  setHeader(name: string, value: string | number | string[]): void;
  
  /**
   * Sends a response
   * @param data Optional data to send
   */
  send(data?: any): Promise<void> | void;
  
  /**
   * Ends the response without sending a body
   */
  end(): Promise<void> | void;
  
  /**
   * Sends a JSON response
   * @param data Data to serialize as JSON
   */
  json(data: any): Promise<void> | void;
  
  /**
   * Sends an HTML response
   * @param html HTML content to send
   */
  html(html: string): Promise<void> | void;
  
  /**
   * Sets the status code and returns the response for chaining
   * @param code HTTP status code
   */
  status(code: number): IHttpResponse;
}
