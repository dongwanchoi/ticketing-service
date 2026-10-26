// 백엔드 Enum 문자열은 그대로 유지하고, 화면에서만 한글 표기로 바꿉니다.
const CATEGORY_LABELS: Record<string, string> = {
  CONCERT: "콘서트",
  MUSICAL: "뮤지컬",
  PLAY: "연극",
  THEATER: "연극",
  FESTIVAL: "페스티벌",
  CLASSIC: "클래식",
  EXHIBITION: "전시",
};

const AGE_LABELS: Record<string, string> = {
  ALL: "전체관람가",
  ALL_AGES: "전체관람가",
  AGE_7: "7세 이상",
  AGE_12: "12세 이상",
  AGE_15: "15세 이상",
  AGE_18: "18세 이상",
  ADULT: "청소년 관람불가",
};

export function getCategoryLabel(value: string): string {
  return CATEGORY_LABELS[value] ?? value;
}

export function getAgeRatingLabel(value: string): string {
  return AGE_LABELS[value] ?? value;
}

// 공식 포스터가 제공되기 전까지 카테고리별 중립적인 대체 배경만 표시합니다.
export function getPosterBackground(category: string): string {
  switch (category) {
    case "MUSICAL":
      return "bg-gradient-to-br from-[#343062] via-[#494181] to-[#766ab4]";
    case "CONCERT":
      return "bg-gradient-to-br from-[#202a44] via-[#365772] to-[#7997aa]";
    case "PLAY":
    case "THEATER":
      return "bg-gradient-to-br from-[#623d32] via-[#986759] to-[#cc9a83]";
    default:
      return "bg-gradient-to-br from-[#413563] via-[#736596] to-[#a89bc0]";
  }
}
