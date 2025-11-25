import React, { useState, useRef } from 'react';
import { 
  Copy, RefreshCw, Moon, Coffee, Music, Sliders, Terminal, Save, 
  Monitor, Sparkles, FileText, Palette, MessageSquare, RotateCcw, 
  ChevronDown, ChevronUp, Youtube, Link as LinkIcon, User, Cat, Wand2,
  Image as ImageIcon, Upload, Play, Dice5
} from 'lucide-react';
import { GoogleGenAI, Type } from "@google/genai";
import { PromptInputs } from '../types';
import { ART_STYLES, KEYWORD_MAP } from '../constants';

const LofiPromptGenerator: React.FC = () => {
  // Changed default values to empty strings to avoid forcing a specific mood/weather
  const [inputs, setInputs] = useState<PromptInputs>({
    mood: '',
    location: '',
    objects: '',
    people: '',    
    animals: '', 
    time: '',
    weather: '',
    ratio: '16:9',
    artStyle: 'anime', 
    customModifiers: [] 
  });

  const [activeAccordion, setActiveAccordion] = useState<string | null>('artStyle');
  const [lyrics, setLyrics] = useState('');
  const [benchmarkLinks, setBenchmarkLinks] = useState(['', '']); 
  const [benchmarkImage, setBenchmarkImage] = useState<string | null>(null);
  const [userFeedback, setUserFeedback] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false); 
  const [isBenchmarking, setIsBenchmarking] = useState(false);
  const [isImageBenchmarking, setIsImageBenchmarking] = useState(false);
  const [isRefining, setIsRefining] = useState(false);
  const [isAutoGenerating, setIsAutoGenerating] = useState(false);
  const [generatedPrompt, setGeneratedPrompt] = useState('');
  const [koreanExplanation, setKoreanExplanation] = useState('');
  const [copied, setCopied] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const translateInput = (text: string) => {
    if (!text) return '';
    const parts = text.split(',').map(part => part.trim());
    const translatedParts = parts.map(part => {
      return KEYWORD_MAP[part] || KEYWORD_MAP[part.replace(/\s/g, '')] || part;
    });
    return translatedParts.join(', ');
  };

  const handleReset = () => {
    setInputs({
      mood: '',
      location: '',
      objects: '',
      people: '',
      animals: '',
      time: '',
      weather: '',
      ratio: '16:9',
      artStyle: 'anime',
      customModifiers: []
    });
    setLyrics('');
    setBenchmarkLinks(['', '']);
    setBenchmarkImage(null);
    setUserFeedback('');
    setGeneratedPrompt('');
    setKoreanExplanation('');
    setActiveAccordion('artStyle');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Main Prompt Generation Logic
  const handleGenerate = (data: PromptInputs = inputs) => {
    const baseStyle = ART_STYLES[data.artStyle]?.prompt || '';
    
    const moodEn = translateInput(data.mood);
    const locationEn = translateInput(data.location);
    const objectsEn = translateInput(data.objects);
    const peopleEn = translateInput(data.people);
    const animalsEn = translateInput(data.animals);
    const timeEn = translateInput(data.time);
    const weatherEn = translateInput(data.weather);
    const modifiersEn = data.customModifiers.join(', ');
    
    const ratioParam = data.ratio ? ` --ar ${data.ratio}` : '';

    let mainDesc = "";
    if (moodEn) mainDesc += `${moodEn}`;
    
    let sceneDesc = "";
    const locationPart = locationEn ? ` situated at ${locationEn}` : "";
    const timePart = timeEn ? ` during ${timeEn}` : "";
    const weatherPart = weatherEn ? ` with ${weatherEn} weather` : "";
    
    if (locationPart || timePart || weatherPart) {
      sceneDesc = `. A scene${locationPart}${timePart}${weatherPart}`;
    }
    
    let charDesc = "";
    if (peopleEn) charDesc += `. ${peopleEn} is visible in the frame`;
    if (animalsEn) charDesc += `. ${animalsEn} is relaxing nearby`;

    let objDesc = "";
    if (objectsEn) objDesc += `. Featuring ${objectsEn}`;

    let modifierDesc = "";
    if (modifiersEn) modifierDesc += ` ${modifiersEn}.`;

    const fullContent = [mainDesc, sceneDesc, charDesc, objDesc].filter(Boolean).join('');
    
    const finalPrompt = `${baseStyle}${modifierDesc} ${fullContent}. Focus on atmosphere. --no people, distracting elements, harsh lights, vibrant colors${ratioParam}`;
    setGeneratedPrompt(finalPrompt);

    let krText = "";
    if (data.weather) krText += `${data.weather} 날씨의 `;
    if (data.time) krText += `${data.time}, `;
    if (data.location) krText += `${data.location}에서 `;
    if (data.mood) krText += `'${data.mood}' 분위기를 담고 있습니다. `;
    if (data.people || data.animals) krText += `\n등장 요소: ${[data.people, data.animals].filter(Boolean).join(', ')}. `;
    if (data.objects) krText += `\n소품: ${data.objects}.`;
    
    if (data.customModifiers.length > 0) {
      krText += `\n\n✨ AI 수정/벤치마킹 반영됨:\n${data.customModifiers.map(m => `- ${m}`).join('\n')}`;
    }
    
    if (!krText) krText = "생성된 프롬프트 정보를 확인하세요.";
    setKoreanExplanation(krText);
  };

  const handleAutoGenerate = async () => {
    setIsAutoGenerating(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: "Create a creative and cohesive scene description for a Lo-fi hip hop music video background. Mix and match elements to create a unique vibe (e.g., Cyberpunk cafe, Fantasy forest, Retro bedroom).",
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              mood: { type: Type.STRING },
              location: { type: Type.STRING },
              objects: { type: Type.STRING },
              people: { type: Type.STRING },
              animals: { type: Type.STRING },
              time: { type: Type.STRING, enum: ['새벽', '밤', '늦은 오후', '아침'] },
              weather: { type: Type.STRING, enum: ['비', '맑음', '눈', '안개', '흐림'] },
              artStyle: { type: Type.STRING, enum: ['anime', 'pixel', 'watercolor', 'isometric', 'cinematic'] },
            },
            required: ["mood", "location", "objects", "people", "animals", "time", "weather", "artStyle"]
          }
        }
      });
      
      const result = JSON.parse(response.text);
      const newInputs = {
        ...inputs,
        ...result,
        customModifiers: [] // Reset modifiers for a fresh auto-gen
      };
      
      setInputs(newInputs);
      handleGenerate(newInputs);
      setActiveAccordion(null); // Close accordions to show we moved to generation
      
    } catch (error) {
      console.error("Auto Gen Error", error);
    } finally {
      setIsAutoGenerating(false);
    }
  };

  const handleSmartFeedback = () => {
    if (!userFeedback.trim()) return;
    setIsRefining(true);

    setTimeout(() => {
      const feedback = userFeedback.toLowerCase();
      const newInputs = { ...inputs };
      let refinedModifier = '';
      let actionLog = ''; 

      if (feedback.includes('비') || feedback.includes('rain')) {
        newInputs.weather = '비';
        actionLog = '날씨를 비로 변경';
      }
      else if (feedback.includes('맑음') || feedback.includes('sunny') || feedback.includes('화창')) {
        newInputs.weather = '맑음';
        actionLog = '날씨를 맑음으로 변경';
      }
      
      if (feedback.includes('밤') || feedback.includes('night') || feedback.includes('어둡게')) {
        newInputs.time = '밤';
        refinedModifier = 'low key lighting, deep shadows'; 
        actionLog = '시간을 밤으로 변경 및 조명 조절';
      }
      else if (feedback.includes('밝게') || feedback.includes('아침') || feedback.includes('day')) {
        newInputs.time = '아침';
        refinedModifier = 'bright natural lighting, high exposure';
        actionLog = '시간을 아침으로 변경 및 조명 조절';
      }

      if (feedback.includes('사람 빼') || feedback.includes('no people') || feedback.includes('혼자')) {
        newInputs.people = '사람 없음';
        actionLog = '인물 제거';
      }
      if (feedback.includes('고양이')) {
        newInputs.animals = '고양이';
        actionLog = '고양이 추가';
      }
      if (feedback.includes('강아지') || feedback.includes('개')) {
        newInputs.animals = '강아지';
        actionLog = '강아지 추가';
      }

      if (feedback.includes('우울') || feedback.includes('슬픔') || feedback.includes('sad')) {
        newInputs.mood = '슬픔/고독';
        refinedModifier = 'blue tones, melancholic atmosphere, lonely vibes';
        actionLog = '우울한 분위기 적용';
      }
      if (feedback.includes('따뜻') || feedback.includes('warm')) {
        refinedModifier = 'warm color palette, orange and yellow tones, cozy atmosphere';
        actionLog = '따뜻한 색감 적용';
      }
      if (feedback.includes('레트로') || feedback.includes('빈티지') || feedback.includes('retro')) {
        refinedModifier = '90s aesthetic, vhs glitch effect, chromatic aberration, noise filter';
        actionLog = '레트로 필터 적용';
      }
      if (feedback.includes('심플') || feedback.includes('깔끔') || feedback.includes('simple')) {
         refinedModifier = 'minimalist composition, clean lines, negative space, flat design';
         actionLog = '미니멀 스타일 적용';
      }
      if (feedback.includes('화려') || feedback.includes('vibrant')) {
        refinedModifier = 'neon lights, saturated colors, cyberpunk vibes';
        actionLog = '화려한 색채 적용';
      }

      if (!refinedModifier && !actionLog) {
         refinedModifier = `emphasizing ${userFeedback}, detailed representation`;
         actionLog = '사용자 요청 반영';
      }

      if (refinedModifier) {
        newInputs.customModifiers = [...newInputs.customModifiers, refinedModifier];
      }
      
      setInputs(newInputs);
      handleGenerate(newInputs); // Regenerate prompt with feedback
      setUserFeedback('');
      setIsRefining(false);
    }, 1200);
  };

  const handleLinkChange = (index: number, value: string) => {
    const newLinks = [...benchmarkLinks];
    newLinks[index] = value;
    setBenchmarkLinks(newLinks);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setBenchmarkImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const analyzeImageBenchmarkHandler = async () => {
    if (!benchmarkImage) return;
    setIsImageBenchmarking(true);

    try {
      const base64Data = benchmarkImage.split(',')[1];
      const mimeType = benchmarkImage.split(';')[0].split(':')[1];
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: {
          parts: [
            {
              inlineData: {
                mimeType: mimeType,
                data: base64Data
              }
            },
            {
              text: `Analyze the visual style of this image for a Lo-fi music video background.
              You MUST return a JSON object with the following fields to configure a generative AI prompt:
              1. 'styleModifier': A detailed, artistic style description string (max 15-20 words).
              2. 'time': Pick one exactly from ['새벽', '밤', '늦은 오후', '아침'].
              3. 'weather': Pick one exactly from ['비', '맑음', '눈', '안개'].
              4. 'mood': Pick one exactly from ['밤샘 공부', '새벽', '휴식', '도시 야경', '몽환적인', '평화로움', '잔잔한', '슬픔/고독', '행복/설렘', '신남/활기', '따뜻함'].
              `
            }
          ]
        },
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              styleModifier: { type: Type.STRING },
              time: { type: Type.STRING },
              weather: { type: Type.STRING },
              mood: { type: Type.STRING },
            },
            required: ["styleModifier", "time", "weather", "mood"]
          }
        }
      });

      const result = JSON.parse(response.text);

      setInputs(prev => ({
        ...prev,
        time: result.time || prev.time,
        weather: result.weather || prev.weather,
        mood: result.mood || prev.mood,
        customModifiers: [
          ...prev.customModifiers.filter(m => !m.startsWith('Benchmarked Style:') && !m.startsWith('Image Style:')), 
          `Image Style: ${result.styleModifier}`
        ]
      }));

    } catch (error) {
      console.error("Gemini Image Benchmark Error", error);
    } finally {
      setIsImageBenchmarking(false);
    }
  };

  const analyzeBenchmarkHandler = async () => {
    const hasLink = benchmarkLinks.some(link => link.trim() !== '');
    if (!hasLink) return;

    setIsBenchmarking(true);
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const linksContext = benchmarkLinks.filter(l => l.trim()).join(', ');
      
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Analyze the implied visual style of a Lo-fi music video from these URLs/Context: "${linksContext}".
        If URLs are generic, imagine a high-quality, trending Lo-fi aesthetic (e.g., Cyberpunk, Cottagecore, Retro 90s, Dreamy).
        
        You MUST return a JSON object with the following fields to configure a generative AI prompt:
        1. 'styleModifier': A detailed, artistic style description string (max 15-20 words).
        2. 'time': Pick one exactly from ['새벽', '밤', '늦은 오후', '아침'].
        3. 'weather': Pick one exactly from ['비', '맑음', '눈', '안개'].
        4. 'mood': Pick one exactly from ['밤샘 공부', '새벽', '휴식', '도시 야경', '몽환적인', '평화로움', '잔잔한', '슬픔/고독', '행복/설렘', '신남/활기', '따뜻함'].
        `,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              styleModifier: { type: Type.STRING },
              time: { type: Type.STRING },
              weather: { type: Type.STRING },
              mood: { type: Type.STRING },
            },
            required: ["styleModifier", "time", "weather", "mood"]
          }
        }
      });

      const result = JSON.parse(response.text);

      setInputs(prev => ({
        ...prev,
        time: result.time || prev.time,
        weather: result.weather || prev.weather,
        mood: result.mood || prev.mood,
        customModifiers: [
          ...prev.customModifiers.filter(m => !m.startsWith('Benchmarked Style:') && !m.startsWith('Image Style:')), 
          `Benchmarked Style: ${result.styleModifier}`
        ]
      }));

    } catch (error) {
      console.error("Gemini Benchmark Error", error);
    } finally {
      setIsBenchmarking(false);
    }
  };

  const analyzeLyricsHandler = () => {
    if (!lyrics.trim()) return;
    setIsAnalyzing(true);
    setTimeout(() => {
      const text = lyrics;
      const newInputs: PromptInputs = { 
        ...inputs, 
        mood: '', location: '', objects: '', people: '', animals: '', time: '', weather: '', 
        customModifiers: [] 
      }; 

      const dictionary = {
        time: { '새벽': ['새벽', '3시'], '밤': ['밤', '달', '별'], '아침': ['아침'], '늦은 오후': ['노을'] },
        weather: { '비': ['비가', '빗소리'], '눈': ['눈이'], '맑음': ['맑은'], '안개': ['안개'] },
        mood: { '슬픔/고독': ['눈물', '이별'], '행복/설렘': ['사랑', '웃음'], '휴식': ['편안'], '평화로움': ['평화'], '따뜻함': ['따뜻한', '온기'] },
        location: { '바다': ['바다'], '카페': ['카페'], '작은 아파트 방': ['방', '침대'], '거리': ['거리'], '교회': ['교회', '성당'], '앞마당': ['마당', '정원'] },
        objects: { '십자가': ['십자가'], '커피': ['커피'], '책': ['성경', '책'] },
        people: { '소녀': ['소녀', '여자'], '소년': ['소년', '남자'], '커플': ['우리', '연인'] },
        animals: { '고양이': ['고양이'], '강아지': ['강아지', '개'], '새': ['새'] }
      };

      const findMatch = (dict: Record<string, string[]>) => {
        for (const [key, words] of Object.entries(dict)) {
          if (words.some(word => text.includes(word))) return key;
        }
        return ''; 
      };

      const matchedTime = findMatch(dictionary.time);
      if (matchedTime) newInputs.time = matchedTime;

      const matchedWeather = findMatch(dictionary.weather);
      if (matchedWeather) newInputs.weather = matchedWeather;

      const matchedMood = findMatch(dictionary.mood);
      if (matchedMood) newInputs.mood = matchedMood;

      const matchedLocation = findMatch(dictionary.location);
      if (matchedLocation) newInputs.location = matchedLocation;

      const matchedObjects = findMatch(dictionary.objects);
      if (matchedObjects) newInputs.objects = matchedObjects;

      const matchedPeople = findMatch(dictionary.people);
      if (matchedPeople) newInputs.people = matchedPeople;

      const matchedAnimals = findMatch(dictionary.animals);
      if (matchedAnimals) newInputs.animals = matchedAnimals;

      if (!newInputs.location && !newInputs.mood && !newInputs.time) {
        newInputs.customModifiers.push(`Context: ${text}`);
      }

      setInputs(newInputs);
      setIsAnalyzing(false);
      setActiveAccordion('peopleAnimals'); 
    }, 1000);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setInputs(prev => ({ ...prev, [name]: value }));
  };

  const copyToClipboard = () => {
    try {
      if (navigator.clipboard) {
        navigator.clipboard.writeText(generatedPrompt);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = generatedPrompt;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) { 
      console.error(err); 
    }
  };

  const toggleAccordion = (section: string) => setActiveAccordion(prev => prev === section ? null : section);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 font-sans flex items-center justify-center p-4">
      <div className="max-w-6xl w-full grid grid-cols-1 xl:grid-cols-12 gap-6">
        <div className="xl:col-span-5 space-y-4">
          <div className="bg-slate-800/50 backdrop-blur-sm p-6 rounded-2xl border border-slate-700 shadow-xl flex flex-col h-full max-h-[90vh] relative">
            <div className="flex items-center justify-between mb-4 flex-shrink-0">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-purple-500/20 rounded-lg"><Music className="w-5 h-5 text-purple-400" /></div>
                <div>
                  <h1 className="text-xl font-bold text-white tracking-tight">Lo-fi Flow</h1>
                  <p className="text-xs text-slate-400">Gemini & Chillhop Prompt Gen</p>
                </div>
              </div>
              <button onClick={handleReset} className="text-xs flex items-center text-slate-400 hover:text-white transition-colors bg-slate-700/50 px-3 py-1.5 rounded-full">
                 <RotateCcw className="w-3 h-3 mr-1" /> 초기화
               </button>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-3 pb-24">
              {/* Analysis Section */}
              <div className="space-y-3 mb-6">
                <div className="bg-slate-900/40 p-3 rounded-xl border border-purple-500/30">
                  <label className="flex items-center text-xs font-semibold text-purple-300 uppercase tracking-wider mb-2">
                    <FileText className="w-3 h-3 mr-2" /> 가사 / 텍스트 기반 추출
                  </label>
                  <textarea 
                    value={lyrics} 
                    onChange={(e) => setLyrics(e.target.value)} 
                    placeholder="예: 십자가가 보이는 교회 앞..." 
                    className="w-full bg-slate-900/80 border border-slate-600 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-purple-500 transition-all placeholder-slate-600 mb-2 h-14 resize-none text-slate-200" 
                  />
                  <button onClick={analyzeLyricsHandler} disabled={isAnalyzing || !lyrics.trim()} className={`w-full py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center ${isAnalyzing ? 'bg-slate-700 text-slate-400' : 'bg-purple-600/20 hover:bg-purple-600/40 text-purple-300'}`}>
                    {isAnalyzing ? <RefreshCw className="w-3 h-3 mr-2 animate-spin" /> : <Sparkles className="w-3 h-3 mr-2" />} {isAnalyzing ? "키워드 입력폼에 적용" : "키워드 입력폼에 적용"}
                  </button>
                </div>

                <div className="bg-slate-900/40 p-3 rounded-xl border border-red-500/30">
                  <label className="flex items-center text-xs font-semibold text-red-300 uppercase tracking-wider mb-2">
                    <Youtube className="w-3 h-3 mr-2" /> 유튜브 스타일 벤치마킹
                  </label>
                  <div className="space-y-2 mb-2">
                    {benchmarkLinks.map((link, idx) => (
                      <div key={idx} className="relative">
                        <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-500" />
                        <input type="text" value={link} onChange={(e) => handleLinkChange(idx, e.target.value)} placeholder={`유튜브 링크 #${idx + 1}`} className="w-full bg-slate-900/80 border border-slate-600 rounded-lg pl-8 pr-3 py-2 text-xs focus:outline-none focus:border-red-500 transition-all placeholder-slate-600 text-slate-200" />
                      </div>
                    ))}
                  </div>
                  <button onClick={analyzeBenchmarkHandler} disabled={isBenchmarking || benchmarkLinks.every(l => !l.trim())} className={`w-full py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center ${isBenchmarking ? 'bg-slate-700 text-slate-400' : 'bg-red-500/20 hover:bg-red-500/40 text-red-300'}`}>
                    {isBenchmarking ? <RefreshCw className="w-3 h-3 mr-2 animate-spin" /> : <Monitor className="w-3 h-3 mr-2" />} {isBenchmarking ? "분석 중..." : "입력폼에 스타일 적용"}
                  </button>
                </div>

                <div className="bg-slate-900/40 p-3 rounded-xl border border-blue-500/30">
                  <label className="flex items-center text-xs font-semibold text-blue-300 uppercase tracking-wider mb-2">
                    <ImageIcon className="w-3 h-3 mr-2" /> 이미지 벤치마킹
                  </label>
                  <div className="flex items-center space-x-2 mb-2">
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      className="flex-1 bg-slate-900/80 border border-slate-600 border-dashed rounded-lg h-14 flex items-center justify-center cursor-pointer hover:border-blue-500 transition-colors group relative overflow-hidden"
                    >
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleImageUpload} 
                        accept="image/*" 
                        className="hidden" 
                      />
                      {benchmarkImage ? (
                        <img src={benchmarkImage} alt="Benchmark" className="w-full h-full object-cover opacity-60 group-hover:opacity-40 transition-opacity" />
                      ) : (
                        <div className="text-center">
                          <Upload className="w-4 h-4 text-slate-500 mx-auto mb-1 group-hover:text-blue-400" />
                          <span className="text-[10px] text-slate-500 group-hover:text-blue-400">클릭하여 이미지 업로드</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <button 
                    onClick={analyzeImageBenchmarkHandler} 
                    disabled={isImageBenchmarking || !benchmarkImage} 
                    className={`w-full py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center ${isImageBenchmarking ? 'bg-slate-700 text-slate-400' : 'bg-blue-500/20 hover:bg-blue-500/40 text-blue-300'}`}
                  >
                    {isImageBenchmarking ? <RefreshCw className="w-3 h-3 mr-2 animate-spin" /> : <Monitor className="w-3 h-3 mr-2" />} 
                    {isImageBenchmarking ? "분석 중..." : "입력폼에 이미지 스타일 적용"}
                  </button>
                </div>
              </div>

              {/* Form Section */}
              <div className="space-y-2">
                <div className="border border-slate-700/50 rounded-lg overflow-hidden bg-slate-900/30">
                  <button onClick={() => toggleAccordion('artStyle')} className="w-full flex items-center justify-between p-3 bg-slate-800/50 hover:bg-slate-700/50 transition-colors text-xs font-semibold text-green-300 uppercase tracking-wider">
                    <div className="flex items-center"><Palette className="w-3 h-3 mr-2" /> 아트 스타일</div>
                    {activeAccordion === 'artStyle' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>
                  {activeAccordion === 'artStyle' && (
                    <div className="p-3 grid grid-cols-2 gap-2 animate-in slide-in-from-top-2 duration-200">
                      {Object.entries(ART_STYLES).map(([key, style]) => (
                        <button key={key} onClick={() => setInputs(prev => ({...prev, artStyle: key}))} className={`py-2 px-3 text-xs text-left rounded-lg border transition-all ${inputs.artStyle === key ? 'bg-green-500/20 border-green-500 text-green-300 font-bold' : 'bg-slate-900/50 border-slate-600 text-slate-400 hover:bg-slate-800'}`}>
                          {style.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="border border-slate-700/50 rounded-lg overflow-hidden bg-slate-900/30">
                  <button onClick={() => toggleAccordion('peopleAnimals')} className="w-full flex items-center justify-between p-3 bg-slate-800/50 hover:bg-slate-700/50 transition-colors text-xs font-semibold text-pink-300 uppercase tracking-wider">
                    <div className="flex items-center"><User className="w-3 h-3 mr-2" /> 인물 및 동물</div>
                    {activeAccordion === 'peopleAnimals' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>
                  {activeAccordion === 'peopleAnimals' && (
                    <div className="p-3 space-y-3 animate-in slide-in-from-top-2 duration-200">
                      <div className="group">
                        <label className="flex items-center text-[10px] text-slate-400 mb-1"><User className="w-3 h-3 mr-1 text-pink-400" /> 인물 (Character)</label>
                        <input type="text" name="people" value={inputs.people} onChange={handleInputChange} placeholder="예: 학생, 소녀, 소년, 커플" className="w-full bg-slate-900/50 border border-slate-600 rounded-lg px-3 py-2 text-xs focus:border-pink-500 outline-none text-slate-200" />
                      </div>
                      <div>
                        <label className="flex items-center text-[10px] text-slate-400 mb-1"><Cat className="w-3 h-3 mr-1 text-pink-400" /> 동물 (Animal)</label>
                        <input type="text" name="animals" value={inputs.animals} onChange={handleInputChange} placeholder="예: 고양이, 강아지, 새" className="w-full bg-slate-900/50 border border-slate-600 rounded-lg px-3 py-2 text-xs focus:border-pink-500 outline-none text-slate-200" />
                      </div>
                    </div>
                  )}
                </div>

                <div className="border border-slate-700/50 rounded-lg overflow-hidden bg-slate-900/30">
                  <button onClick={() => toggleAccordion('moodPlace')} className="w-full flex items-center justify-between p-3 bg-slate-800/50 hover:bg-slate-700/50 transition-colors text-xs font-semibold text-purple-300 uppercase tracking-wider">
                    <div className="flex items-center"><Sliders className="w-3 h-3 mr-2" /> 분위기 및 장소</div>
                    {activeAccordion === 'moodPlace' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>
                  {activeAccordion === 'moodPlace' && (
                    <div className="p-3 space-y-3 animate-in slide-in-from-top-2 duration-200">
                      <div className="group">
                        <label className="block text-[10px] text-slate-400 mb-1">분위기 (Mood)</label>
                        <input type="text" name="mood" value={inputs.mood} onChange={handleInputChange} placeholder="예: 밤샘 공부, 몽환적인" className="w-full bg-slate-900/50 border border-slate-600 rounded-lg px-3 py-2 text-xs focus:border-purple-500 outline-none text-slate-200" />
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-400 mb-1">장소 (Location)</label>
                        <input type="text" name="location" value={inputs.location} onChange={handleInputChange} placeholder="예: 창가, 작은 아파트 방" className="w-full bg-slate-900/50 border border-slate-600 rounded-lg px-3 py-2 text-xs focus:border-blue-500 outline-none text-slate-200" />
                      </div>
                    </div>
                  )}
                </div>

                <div className="border border-slate-700/50 rounded-lg overflow-hidden bg-slate-900/30">
                  <button onClick={() => toggleAccordion('objects')} className="w-full flex items-center justify-between p-3 bg-slate-800/50 hover:bg-slate-700/50 transition-colors text-xs font-semibold text-amber-300 uppercase tracking-wider">
                    <div className="flex items-center"><Coffee className="w-3 h-3 mr-2" /> 오브젝트</div>
                    {activeAccordion === 'objects' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>
                  {activeAccordion === 'objects' && (
                    <div className="p-3 animate-in slide-in-from-top-2 duration-200">
                      <input type="text" name="objects" value={inputs.objects} onChange={handleInputChange} placeholder="예: 노트북, 커피, 고양이" className="w-full bg-slate-900/50 border border-slate-600 rounded-lg px-3 py-2 text-xs focus:border-amber-500 outline-none text-slate-200" />
                    </div>
                  )}
                </div>

                <div className="border border-slate-700/50 rounded-lg overflow-hidden bg-slate-900/30">
                  <button onClick={() => toggleAccordion('timeWeather')} className="w-full flex items-center justify-between p-3 bg-slate-800/50 hover:bg-slate-700/50 transition-colors text-xs font-semibold text-indigo-300 uppercase tracking-wider">
                    <div className="flex items-center"><Moon className="w-3 h-3 mr-2" /> 시간 및 날씨</div>
                    {activeAccordion === 'timeWeather' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>
                  {activeAccordion === 'timeWeather' && (
                    <div className="p-3 grid grid-cols-2 gap-3 animate-in slide-in-from-top-2 duration-200">
                      <div>
                        <label className="block text-[10px] text-slate-400 mb-1">시간 (Time)</label>
                        <select name="time" value={inputs.time} onChange={handleInputChange} className="w-full bg-slate-900/50 border border-slate-600 rounded-lg px-2 py-2 text-xs outline-none cursor-pointer text-slate-200">
                          <option value="">선택 안함</option>
                          <option value="새벽">새벽</option>
                          <option value="밤">밤</option>
                          <option value="늦은 오후">늦은 오후</option>
                          <option value="아침">아침</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-400 mb-1">날씨 (Weather)</label>
                        <select name="weather" value={inputs.weather} onChange={handleInputChange} className="w-full bg-slate-900/50 border border-slate-600 rounded-lg px-2 py-2 text-xs outline-none cursor-pointer text-slate-200">
                          <option value="">선택 안함</option>
                          <option value="비">비</option>
                          <option value="맑음">맑음</option>
                          <option value="눈">눈</option>
                          <option value="안개">안개</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-2">
                  <label className="flex items-center text-xs font-semibold text-pink-300 uppercase tracking-wider mb-2">
                    <Monitor className="w-3 h-3 mr-2" /> 화면 비율
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {[{ label: '16:9', value: '16:9' }, { label: '9:16', value: '9:16' }, { label: '1:1', value: '1:1' }, { label: '4:5', value: '4:5' }].map((option) => (
                      <button key={option.value} onClick={() => setInputs(prev => ({ ...prev, ratio: option.value }))} className={`py-1.5 px-1 text-xs rounded-lg border transition-all ${inputs.ratio === option.value ? 'bg-pink-500/20 border-pink-500 text-pink-300 font-bold' : 'bg-slate-900/50 border-slate-600 text-slate-400 hover:bg-slate-800'}`}>
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Fixed Footer Buttons */}
            <div className="absolute bottom-0 left-0 w-full p-4 bg-slate-900/90 backdrop-blur-md rounded-b-2xl border-t border-slate-700/50 flex flex-col gap-2 z-20">
              <button 
                onClick={() => handleGenerate()} 
                className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 rounded-xl font-bold text-white shadow-lg shadow-purple-900/30 flex items-center justify-center transition-all transform hover:scale-[1.02]"
              >
                <Play className="w-4 h-4 mr-2 fill-current" />
                프롬프트 생성 (Generate Prompt)
              </button>
              
              <button 
                onClick={handleAutoGenerate} 
                disabled={isAutoGenerating}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-xl font-semibold text-indigo-300 flex items-center justify-center transition-all text-sm"
              >
                {isAutoGenerating ? (
                  <RefreshCw className="w-3 h-3 mr-2 animate-spin" />
                ) : (
                  <Dice5 className="w-4 h-4 mr-2" />
                )}
                {isAutoGenerating ? "AI가 상상하는 중..." : "AI 자동 생성 (Random Creative)"}
              </button>
            </div>
          </div>
        </div>

        <div className="xl:col-span-7 flex flex-col space-y-4">
          <div className="bg-slate-950 rounded-2xl border border-slate-800 p-1 shadow-2xl relative overflow-hidden group flex-1 flex flex-col max-h-[90vh]">
             <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 opacity-70"></div>
             <div className="h-full bg-slate-900 rounded-xl p-6 flex flex-col relative z-10">
                <div className="flex justify-between items-center mb-4 flex-shrink-0">
                  <h2 className="text-sm font-bold text-slate-300 uppercase tracking-widest flex items-center">
                    <Terminal className="w-4 h-4 mr-2" /> Generated Prompt
                  </h2>
                  <div className="text-xs text-slate-500 font-mono">Total Length: {generatedPrompt.length}</div>
                </div>

                <div className="flex-1 bg-black/40 rounded-lg p-4 mb-4 border border-slate-700/50 font-mono text-sm leading-relaxed overflow-y-auto custom-scrollbar text-gray-300">
                  {generatedPrompt ? (
                    <>
                      <span className="text-green-400 font-bold select-none">gemini &gt; </span>
                      {generatedPrompt}
                      <span className="animate-pulse inline-block w-2 h-4 ml-1 bg-green-500 align-middle"></span>
                    </>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-slate-600 space-y-3">
                      <Terminal className="w-8 h-8 opacity-50" />
                      <p className="text-center text-xs">
                        좌측 옵션을 선택하고<br/>
                        <span className="text-purple-400 font-bold">"프롬프트 생성"</span> 버튼을 눌러주세요.
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex-shrink-0 space-y-4">
                  <button onClick={copyToClipboard} disabled={!generatedPrompt} className={`w-full py-3 rounded-xl font-bold text-sm transition-all duration-300 flex items-center justify-center space-x-2 shadow-lg ${copied ? 'bg-green-500/20 text-green-400 border border-green-500/50' : 'bg-purple-600 hover:bg-purple-500 text-white border border-purple-500 disabled:opacity-50 disabled:cursor-not-allowed'}`}>
                    {copied ? <><Save className="w-4 h-4" /><span>복사 완료!</span></> : <><Copy className="w-4 h-4" /><span>프롬프트 복사</span></>}
                  </button>

                  <div className="relative">
                     <input type="text" value={userFeedback} onChange={(e) => setUserFeedback(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && !isRefining && handleSmartFeedback()} disabled={isRefining || !generatedPrompt} placeholder="AI에게 수정 요청 (예: 좀 더 어둡게, 사람 빼줘, 비 오게 해줘)" className="w-full bg-slate-800/50 border border-slate-600 rounded-lg pl-4 pr-12 py-3 text-xs focus:border-purple-500 outline-none text-white placeholder-slate-500 disabled:opacity-50" />
                     <button onClick={handleSmartFeedback} disabled={isRefining || !generatedPrompt} className={`absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md transition-all ${isRefining ? 'text-slate-500' : 'bg-purple-500/20 text-purple-400 hover:bg-purple-500 hover:text-white'}`}>
                       {isRefining ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3" />}
                     </button>
                  </div>
                </div>
             </div>
          </div>

          <div className="bg-slate-800/30 rounded-xl border border-slate-700/50 p-5 flex-shrink-0">
            <h3 className="text-xs font-bold text-slate-400 uppercase mb-3 flex items-center">
              <MessageSquare className="w-3 h-3 mr-2" /> 프롬프트 설명 (Korean Analysis)
            </h3>
            <div className="bg-slate-900/50 rounded-lg p-4 text-sm text-slate-300 leading-relaxed border border-slate-700/30 whitespace-pre-line min-h-[100px]">
              {koreanExplanation || <span className="text-slate-600">프롬프트가 생성되면 이곳에 한국어 설명이 표시됩니다.</span>}
            </div>
            
            <div className="mt-3 flex flex-wrap gap-2">
              {inputs.customModifiers.map((mod, idx) => (
                <span key={idx} className="text-[10px] bg-purple-500/10 text-purple-300 px-2 py-1 rounded-full border border-purple-500/20 truncate max-w-[300px]" title={mod}>
                  AI Refined: {mod}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LofiPromptGenerator;