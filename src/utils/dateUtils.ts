/**
 * 날짜 및 시간 포맷팅 유틸리티
 */

/**
 * 날짜를 'YYYY.MM.DD' 형식으로 포맷팅합니다.
 * @param date 날짜 객체 또는 타임스탬프
 * @returns 포맷팅된 날짜 문자열
 */
export const formatDate = (date: Date | number | string): string => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  
  return `${year}.${month}.${day}`;
};

/**
 * 날짜를 'YYYY.MM.DD HH:MM' 형식으로 포맷팅합니다.
 * @param date 날짜 객체 또는 타임스탬프
 * @returns 포맷팅된 날짜 및 시간 문자열
 */
export const formatDateTime = (date: Date | number | string): string => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  
  return `${year}.${month}.${day} ${hours}:${minutes}`;
};

/**
 * 날짜를 상대적 시간으로 포맷팅합니다. (예: '방금 전', '1시간 전')
 * @param date 날짜 객체 또는 타임스탬프
 * @returns 상대적 시간 문자열
 */
export const formatRelativeTime = (date: Date | number | string): string => {
  const d = new Date(date);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - d.getTime()) / 1000);
  
  if (diffInSeconds < 60) {
    return '방금 전';
  }
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes}분 전`;
  }
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours}시간 전`;
  }
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `${diffInDays}일 전`;
  }
  
  // 일주일 이상 지난 경우 날짜 형식으로 표시
  return formatDate(date);
};

/**
 * 두 날짜가 같은 날인지 확인합니다.
 * @param date1 첫 번째 날짜
 * @param date2 두 번째 날짜
 * @returns 같은 날이면 true, 아니면 false
 */
export const isSameDay = (date1: Date | number | string, date2: Date | number | string): boolean => {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
};

/**
 * 오늘 날짜인지 확인합니다.
 * @param date 확인할 날짜
 * @returns 오늘이면 true, 아니면 false
 */
export const isToday = (date: Date | number | string): boolean => {
  return isSameDay(date, new Date());
};

/**
 * 어제 날짜인지 확인합니다.
 * @param date 확인할 날짜
 * @returns 어제면 true, 아니면 false
 */
export const isYesterday = (date: Date | number | string): boolean => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return isSameDay(date, yesterday);
}; 