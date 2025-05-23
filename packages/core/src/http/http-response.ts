export interface IHttpResponse {
  statusCode: number;
  readonly isSent: boolean; // Cờ để kiểm tra response đã được gửi chưa
  setHeader(name: string, value: string | number | string[]): void;
  send(data?: any): Promise<void> | void; // send có thể là async
  json(data: any): Promise<void> | void; // json có thể là async
  html(html: string): Promise<void> | void;
  status(code: number): IHttpResponse; // Cho phép chaining
  // Thêm các phương thức khác nếu cần (ví dụ: redirect, cookie, end)
}
