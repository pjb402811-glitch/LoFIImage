import { ArtStylesMap, KeywordMap } from './types';

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
  }
};

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