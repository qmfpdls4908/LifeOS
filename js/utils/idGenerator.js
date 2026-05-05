/**
 * 안전한 UUID 생성 유틸리티
 * - 보안 컨텍스트(HTTPS/localhost): crypto.randomUUID() 사용
 * - HTTP/외부IP 등 비보안 컨텍스트: timestamp + random 폴백
 */
export function generateId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // 폴백: crypto.randomUUID 없는 환경 (HTTP, 구형 브라우저 등)
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}
