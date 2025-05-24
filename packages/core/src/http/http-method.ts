/**
 * HTTP methods supported by the framework
 */
export enum HttpMethod {
  /** HTTP GET method */
  GET = "GET",
  /** HTTP POST method */
  POST = "POST",
  /** HTTP PUT method */
  PUT = "PUT",
  /** HTTP DELETE method */
  DELETE = "DELETE",
  /** HTTP PATCH method */
  PATCH = "PATCH",
  /** HTTP OPTIONS method */
  OPTIONS = "OPTIONS",
  /** HTTP HEAD method */
  HEAD = "HEAD",
  /** Special value for matching any HTTP method */
  ALL = "*"
}
