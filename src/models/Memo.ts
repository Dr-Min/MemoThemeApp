export interface Memo {
  id: string;           // 고유 식별자
  content: string;      // 메모 내용
  createdAt: Date;      // 생성 시간
  updatedAt: Date;      // 수정 시간
  themes: string[];     // 연결된 테마 ID 배열
}

// 새 메모 생성을 위한 팩토리 함수
export const createMemo = (content: string, themes: string[] = []): Memo => {
  const now = new Date();
  return {
    id: Date.now().toString(),
    content,
    createdAt: now,
    updatedAt: now,
    themes
  };
}; 