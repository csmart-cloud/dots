/**
 * Định nghĩa vòng đời của một service trong DI container.
 * Tương tự ServiceLifetime trong Microsoft.Extensions.DependencyInjection.
 */
export enum ServiceLifetime {
  Singleton, // Một instance duy nhất trong suốt vòng đời ứng dụng.
  Scoped, // Một instance duy nhất cho mỗi scope (ví dụ: mỗi request).
  Transient, // Một instance mới mỗi khi được yêu cầu.
}
