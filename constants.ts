import { ArtStylesMap, KeywordMap, Preset } from './types';

export const ART_STYLES: ArtStylesMap = {
  anime: { 
    label: 'Lo-fi Anime', 
    prompt: 'Lo-fi and Chillhop anime art style, calming, cozy, nostalgic, soft ambient lighting, muted color palette, grainy film texture, subtle depth of field.' 
  },
  pixel: { 
    label: 'Pixel Art', 
    prompt: '16-bit pixel art style, retro game aesthetic, vibrant but cozy colors, dithering, isometric perspective, arcade nostalgia.' 
  },
  watercolor: { 
    label: 'Watercolor', 
    prompt: 'Soft watercolor painting, artistic texture, wet-on-wet technique, pastel colors, dreamy atmosphere, paper texture, hand-drawn feel.' 
  },
  isometric: { 
    label: '3D Isometric', 
    prompt: '3D blender render, isometric view, soft clay texture, cozy lighting, miniature world feel, orthographic camera, clean edges.' 
  },
  cinematic: { 
    label: 'Cinematic Photo', 
    prompt: 'Cinematic photography, photorealistic, 35mm film, bokeh, golden hour, highly detailed, 8k resolution, atmospheric lighting.' 
  },
  realistic_4k: {
    label: '4K Realistic',
    prompt: 'Hyper-realistic photography, 4k resolution, sharp focus, incredibly detailed textures, ray tracing, architectural digest style, professional lighting, clean and crisp, unreal engine 5 render.'
  }
};

export const PRESETS: Preset[] = [
  // Pair 1: Daily Life
  {
    label: "새벽 공부",
    emoji: "🌙",
    category: 'daily',
    data: { mood: "Deep Focus", location: "Cluttered Desk", time: "새벽", weather: "비", people: "학생", objects: "노트북, 커피, 스탠드" }
  },
  {
    label: "나른한 주말 아침",
    emoji: "☀️",
    category: 'daily',
    data: { mood: "Relaxed", location: "Bedroom", time: "아침", weather: "맑음", people: "사람 없음", animals: "고양이", objects: "하얀 커튼, 김이 나는 머그잔" }
  },

  // Pair 2: Cafe Life
  {
    label: "비 오는 카페",
    emoji: "☕",
    category: 'daily',
    data: { mood: "Chill", location: "Cozy Cafe", time: "늦은 오후", weather: "비", people: "사람 없음", objects: "따뜻한 커피, 책, 창문의 빗방울" }
  },
  {
    label: "햇살 가득 브런치",
    emoji: "🥯",
    category: 'daily',
    data: { mood: "Cheerful", location: "Cafe Window Seat", time: "아침", weather: "맑음", people: "사람 없음", objects: "맛있는 빵, 커피, 밝은 우드톤 인테리어" }
  },

  // Pair 3: Work & Play
  {
    label: "레트로 게임",
    emoji: "🎮",
    category: 'daily',
    data: { mood: "Nostalgic", location: "90s Bedroom", time: "밤", artStyle: "pixel", objects: "CRT TV, Game Console, Posters" }
  },
  {
    label: "탁 트인 공유 오피스",
    emoji: "💻",
    category: 'daily',
    data: { mood: "Productive", location: "Modern Office", time: "늦은 오후", weather: "맑음", people: "열심히 일하는 사람들", objects: "식물, 노트북, 큰 창문" }
  },

  // Pair 4: Travel/City
  {
    label: "도시의 노을",
    emoji: "🌆",
    category: 'daily',
    data: { mood: "Melancholic", location: "Rooftop", time: "늦은 오후", weather: "맑음", objects: "난간, 맥주, 도시 야경" }
  },
  {
    label: "해안도로 드라이브",
    emoji: "🚗",
    category: 'travel',
    data: { mood: "Refreshing", location: "Coastal Road", time: "아침", weather: "맑음", artStyle: "anime", objects: "컨버터블 차, 야자수, 바다" }
  },

  // Pair 5: Travel/Fantasy
  {
    label: "판타지 숲",
    emoji: "🌲",
    category: 'travel',
    data: { mood: "Mysterious", location: "Glowing Forest", time: "밤", weather: "안개", animals: "정령", objects: "반딧불이, 거대한 나무" }
  },
  {
    label: "한강 피크닉",
    emoji: "🧺",
    category: 'travel',
    data: { mood: "Peaceful", location: "Park", time: "아침", weather: "맑음", objects: "초록색 잔디밭, 돗자리, 샌드위치, 자전거" }
  },

  // Pair 6: Travel (Beach/Airport)
  {
    label: "한적한 바다",
    emoji: "🌊",
    category: 'travel',
    data: { mood: "Peaceful", location: "Beach", time: "아침", weather: "맑음", objects: "야자수, 라디오", animals: "갈매기" }
  },
  {
    label: "공항 라운지",
    emoji: "✈️",
    category: 'travel',
    data: { mood: "Excited", location: "Airport Lounge", time: "아침", weather: "맑음", objects: "통창 너머 비행기, 캐리어, 여권" }
  },

  // Pair 7: Spring (Seasonal)
  {
    label: "벚꽃 흩날리는 봄",
    emoji: "🌸",
    category: 'season',
    data: { mood: "Romantic", location: "Cherry Blossom Street", time: "늦은 오후", weather: "맑음", objects: "핑크빛 벚꽃, 흩날리는 꽃잎" }
  },
  {
    label: "따스한 꽃집 (봄)",
    emoji: "💐",
    category: 'season',
    data: { mood: "Refreshing", location: "Flower Shop", time: "아침", weather: "맑음", objects: "형형색색의 꽃, 물뿌리개, 앞치마", people: "소녀" }
  },

  // Pair 8: Summer (Seasonal)
  {
    label: "시골집 마루 (여름)",
    emoji: "🍉",
    category: 'season',
    data: { mood: "Nostalgic", location: "Korean Countryside House", time: "늦은 오후", weather: "맑음", objects: "수박, 선풍기, 매미 소리, 나무 마루" }
  },
  {
    label: "여름 밤 캠핑",
    emoji: "⛺",
    category: 'season',
    data: { mood: "Adventurous", location: "Camping Site", time: "밤", weather: "맑음", objects: "텐트, 모닥불, 밤하늘의 별, 통기타" }
  },

  // Pair 9: Autumn (Seasonal)
  {
    label: "낙엽 지는 벤치 (가을)",
    emoji: "🍂",
    category: 'season',
    data: { mood: "Sentimental", location: "Autumn Park", time: "늦은 오후", weather: "맑음", objects: "붉은 단풍, 나무 벤치, 책, 트렌치 코트" }
  },
  {
    label: "비 오는 헌책방 (가을)",
    emoji: "📚",
    category: 'season',
    data: { mood: "Quiet", location: "Old Bookstore", time: "늦은 오후", weather: "비", objects: "쌓인 책들, 노란 조명, 종이 냄새" }
  },

  // Pair 10: Winter (Seasonal)
  {
    label: "따뜻한 벽난로 (겨울)",
    emoji: "🎄",
    category: 'season',
    data: { mood: "Cozy", location: "Living Room", time: "밤", weather: "눈", objects: "벽난로, 장작불, 크리스마스 장식, 선물 상자" }
  },
  {
    label: "눈 내리는 거리 (겨울)",
    emoji: "❄️",
    category: 'season',
    data: { mood: "Sentimental", location: "Snowy City Street", time: "밤", weather: "눈", objects: "가로등, 쌓인 눈, 발자국, 목도리" }
  }
];

export const KEYWORD_MAP: KeywordMap = {
  '밤샘 공부': 'late night study session, deep focus',
  '새벽': 'early dawn, quiet atmosphere',
  '휴식': 'relaxing, chill vibe',
  '도시 야경': 'city night view, bokeh lights',
  '몽환적인': 'dreamy, ethereal',
  '평화로움': 'peaceful, serene',
  '잔잔한': 'calm, tranquil',
  '슬픔/고독': 'melancholic, solitary, emotional',
  '행복/설렘': 'happy, cheerful, romantic',
  '신남/활기': 'upbeat, energetic, vibrant',
  '따뜻함': 'warm, cozy, heartwarming',
  
  // Locations
  '창가': 'by the window',
  '책상 위': 'cluttered desk setup',
  '작은 아파트 방': 'small cozy apartment room',
  '루프탑': 'rooftop terrace',
  '도서관': 'library corner',
  '뒷골목': 'back alley',
  '바다': 'ocean view, beach side',
  '카페': 'cozy cafe interior',
  '거리': 'city street',
  '교회': 'old church exterior, spiritual atmosphere',
  '앞마당': 'front yard, garden, grassy lawn',
  '공원': 'park, nature',
  
  // People
  '학생': 'a student studying hard, headphones on',
  '소녀': 'a lo-fi girl, relaxed posture',
  '소년': 'a lo-fi boy, casual hoodie',
  '여자': 'a young woman',
  '남자': 'a young man',
  '커플': 'a couple sitting together',
  '사람 없음': 'no people, empty scene',
  
  // Animals
  '고양이': 'a sleeping cat, fluffy',
  '강아지': 'a puppy resting, cute dog',
  '새': 'birds sitting on power lines',
  '너구리': 'a raccoon looking curious',
  
  // Objects
  '커피': 'steaming cup of coffee',
  '노트북': 'open laptop',
  '책': 'stacked books',
  '헤드폰': 'headphones',
  '식물': 'potted plants',
  '가로등': 'street lamp',
  '술/와인': 'glass of wine, cocktail',
  '편지': 'handwritten letter',
  '십자가': 'cross symbol, holy mood',
  
  // Time
  '밤': 'night time',
  '늦은 오후': 'late afternoon, golden hour',
  '초저녁': 'dusk, blue hour',
  '아침': 'morning sunlight, fresh air',
  
  // Weather
  '비': 'rainy, raindrops on glass',
  '눈': 'snowy, gentle snowfall',
  '안개': 'foggy, misty',
  '맑음': 'clear sky, sunny',
  '흐림': 'cloudy, overcast'
};