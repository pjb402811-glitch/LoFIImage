import React, { useState, useRef } from 'react';
import { 
  Copy, RefreshCw, Moon, Coffee, Music, Sliders, Terminal, Save, 
  Monitor, Sparkles, FileText, Palette, MessageSquare, RotateCcw, 
  ChevronDown, ChevronUp, Youtube, Link as LinkIcon, User, Cat, Wand2,
  Image as ImageIcon, Upload, Play, Dice5, History, Clock, ArrowRight, Zap
} from 'lucide-react';
import { GoogleGenAI, Type } from "@google/genai";
import { PromptInputs, HistoryItem, PresetCategory } from '../types';
import { ART_STYLES, KEYWORD_MAP, PRESETS } from '../constants';

const LofiPromptGenerator: React.FC = () => {
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
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<PresetCategory | 'all'>('all');

  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  
  // Changed to array to allow multiple open sections, initialized with all sections open
  const [activeAccordions, setActiveAccordions] = useState<string[]>([
    'artStyle', 'peopleAnimals', 'moodPlace', 'objects', 'timeWeather'
  ]);
  
  const [lyrics, setLyrics] = useState('');
  const [benchmarkLinks, setBenchmarkLinks] = useState(['', '']); 
  const [benchmarkImage, setBenchmarkImage] = useState<string | null>(null);
  const [userFeedback, setUserFeedback] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false); 
  const [isBenchmarking, setIsBenchmarking] = useState(false);
  const [isImageBenchmarking, setIsImageBenchmarking] = useState(false);
  const [isRefining, setIsRefining] = useState(false);
  const [isAutoGenerating, setIsAutoGenerating] = useState(false);
  const [isGeneratingPrompt, setIsGeneratingPrompt] = useState(false);
  const [generatedPrompt, setGeneratedPrompt] = useState('');
  const [koreanExplanation, setKoreanExplanation] = useState('');
  const [copied, setCopied] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    // Reset to all open
    setActiveAccordions(['artStyle', 'peopleAnimals', 'moodPlace', 'objects', 'timeWeather']);
    setActivePreset(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const hasKorean = (text: string) => /[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/.test(text);

  const prepareField = (text: string, collection: string[]) => {
    if (!text) return '';
    const parts = text.split(',').map(part => part.trim());
    return parts.map(part => {
      const mapped = KEYWORD_MAP[part] || KEYWORD_MAP[part.replace(/\s/g, '')];
      if (mapped) return mapped;
      if (hasKorean(part)) {
        collection.push(part);
        return `__TRANS_${part}__`;
      }
      return part;
    }).join(', ');
  };

  const addToHistory = (prompt: string, explanation: string, currentInputs: PromptInputs) => {
    const newItem: HistoryItem = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      prompt,
      koreanExplanation: explanation,
      inputs: { ...currentInputs }
    };
    setHistory(prev => [newItem, ...prev].slice(0, 10)); // Keep last 10
  };

  const restoreHistory = (item: HistoryItem) => {
    setInputs(item.inputs);
    setGeneratedPrompt(item.prompt);
    setKoreanExplanation(item.koreanExplanation);
    setShowHistory(false);
    setActivePreset(null); // Clear preset selection on restore
  };

  const applyPreset = (presetData: Partial<PromptInputs>) => {
    const matchedPreset = PRESETS.find(p => JSON.stringify(p.data) === JSON.stringify(presetData));
    if (matchedPreset) {
      setActivePreset(matchedPreset.label);
    }
    
    setInputs(prev => ({
      ...prev,
      ...presetData
    }));
  };

  const filteredPresets = PRESETS.filter(p => activeCategory === 'all' || p.category === activeCategory);

  const handleGenerate = async (data: PromptInputs = inputs) => {
    setIsGeneratingPrompt(true);
    setShowHistory(false);
    try {
      const baseStyle = ART_STYLES[data.artStyle]?.prompt || '';
      const koreanToTranslate: string[] = [];

      let moodEn = prepareField(data.mood, koreanToTranslate);
      let locationEn = prepareField(data.location, koreanToTranslate);
      let objectsEn = prepareField(data.objects, koreanToTranslate);
      let peopleEn = prepareField(data.people, koreanToTranslate);
      let animalsEn = prepareField(data.animals, koreanToTranslate);
      let timeEn = prepareField(data.time, koreanToTranslate);
      let weatherEn = prepareField(data.weather, koreanToTranslate);
      
      const modifiersProcessed = data.customModifiers.map(mod => {
        if (hasKorean(mod)) {
          koreanToTranslate.push(mod);
          return `__TRANS_${mod}__`;
        }
        return mod;
      });
      let modifiersEn = modifiersProcessed.join(', ');

      let translationMap: Record<string, string> = {};
      if (koreanToTranslate.length > 0) {
        const uniqueTerms = [...new Set(koreanToTranslate)];
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: `Translate the following Korean terms into descriptive English keywords suitable for an AI image prompt (Midjourney). Return ONLY a JSON object where keys are the Korean terms and values are the English translations. Terms: ${JSON.stringify(uniqueTerms)}`,
          config: {
            responseMimeType: "application/json"
          }
        });
        translationMap = JSON.parse(response.text);
      }

      const replace = (text: string) => {
        return text.replace(/__TRANS_(.*?)__/g, (_, term) => translationMap[term] || term);
      };

      moodEn = replace(moodEn);
      locationEn = replace(locationEn);
      objectsEn = replace(objectsEn);
      peopleEn = replace(peopleEn);
      animalsEn = replace(animalsEn);
      timeEn = replace(timeEn);
      weatherEn = replace(weatherEn);
      modifiersEn = replace(modifiersEn);
      
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
      
      // Customize prompt structure slightly based on art style
      let finalPrompt = '';
      if (data.artStyle === 'realistic_4k') {
         finalPrompt = `${baseStyle} ${fullContent}${modifierDesc}. Photorealistic, ultra detailed, 8k. --no people, cartoon, drawing, anime, blurry, low resolution${ratioParam}`;
      } else {
         finalPrompt = `${baseStyle}${modifierDesc} ${fullContent}. Focus on atmosphere. --no people, distracting elements, harsh lights, vibrant colors${ratioParam}`;
      }

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
      addToHistory(finalPrompt, krText, data);

    } catch (error) {
      console.error("Generation Error", error);
      setGeneratedPrompt("Error generating prompt. Please try again.");
    } finally {
      setIsGeneratingPrompt(false);
    }
  };

  const handleAutoGenerate = async () => {
    setIsAutoGenerating(true);
    try {
      let imageStyleInstruction = "";
      const imageStyleModifier = inputs.customModifiers.find(m => m.startsWith('Image Style:'));
      
      if (imageStyleModifier) {
        imageStyleInstruction = `The user has provided a reference image style: "${imageStyleModifier}". You MUST respect this visual style (e.g. colors, texture) while generating a new scene (location, mood). Do NOT change the art style to something conflicting.`;
      }

      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Create a UNIQUE, CREATIVE, and slightly NICHE scene description for a Lo-fi hip hop music video background. 
        Avoid common "bedroom/cafe" tropes if possible. Try themes like Solarpunk, Cyberpunk, Fantasy Forest, Medieval, Space Station, Underwater, or Post-Apocalyptic Nature.
        
        Mix and match elements to create a unique vibe. 
        IMPORTANT: All string values must be in English. ${imageStyleInstruction}`,
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
              artStyle: { type: Type.STRING, enum: ['anime', 'pixel', 'watercolor', 'isometric', 'cinematic', 'realistic_4k'] },
            },
            required: ["mood", "location", "objects", "people", "animals", "time", "weather", "artStyle"]
          }
        }
      });
      
      const result = JSON.parse(response.text);
      const newInputs = {
        ...inputs,
        ...result,
        customModifiers: imageStyleModifier ? [imageStyleModifier] : []
      };
      
      setInputs(newInputs);
      setActivePreset(null); // Auto gen is not a preset
      handleGenerate(newInputs);
      // Ensure all accordions are open to show the generated values
      setActiveAccordions(['artStyle', 'peopleAnimals', 'moodPlace', 'objects', 'timeWeather']);
      
    } catch (error) {
      console.error("Auto Gen Error", error);
    } finally {
      setIsAutoGenerating(false);
    }
  };

  const handleSmartFeedback = async () => {
    if (!userFeedback.trim()) return;
    setIsRefining(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Analyze this user feedback for a Lo-fi image prompt: "${userFeedback}".
        The current state is: ${JSON.stringify(inputs)}.
        
        Return a JSON object with:
        1. 'updates': Object containing any fields (mood, location, time, weather, people, animals, objects) that should be updated. Values for 'time' must be ['새벽', '밤', '늦은 오후', '아침']. Values for 'weather' must be ['비', '맑음', '눈', '안개', '흐림']. Other fields should be in English.
        2. 'customModifier': A string in ENGLISH describing the visual style change or specific detail requested (e.g. "add more neon lights", "make it look sad"). If no visual style change is needed, return empty string.
        `,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              updates: {
                 type: Type.OBJECT,
                 properties: {
                    mood: { type: Type.STRING },
                    location: { type: Type.STRING },
                    objects: { type: Type.STRING },
                    people: { type: Type.STRING },
                    animals: { type: Type.STRING },
                    time: { type: Type.STRING },
                    weather: { type: Type.STRING }
                 }
              },
              customModifier: { type: Type.STRING }
            }
          }
        }
      });

      const result = JSON.parse(response.text);
      const newInputs = { ...inputs, ...result.updates };
      
      if (result.customModifier) {
        newInputs.customModifiers = [...newInputs.customModifiers, result.customModifier];
      }
      
      setInputs(newInputs);
      setActivePreset(null); // Custom changes invalidate preset
      await handleGenerate(newInputs);
      setUserFeedback('');
      
    } catch (error) {
       console.error("Smart Feedback Error", error);
    } finally {
       setIsRefining(false);
    }
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
              Return a JSON object with the following fields to configure a generative AI prompt.
              IMPORTANT: 'styleModifier' and 'mood' MUST be in ENGLISH.
              
              1. 'styleModifier': A detailed, artistic style description string in English (max 15-20 words).
              2. 'time': Pick one exactly from ['새벽', '밤', '늦은 오후', '아침'].
              3. 'weather': Pick one exactly from ['비', '맑음', '눈', '안개', '흐림'].
              4. 'mood': A mood keyword in English (e.g. "Relaxing", "Melancholic").
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
      setActivePreset(null); // Benchmarking overrides preset

    } catch (error) {
      console.error("Gemini Image Benchmark Error", error);
    } finally {
      setIsImageBenchmarking(false);
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
      setActivePreset(null);
      setIsAnalyzing(false);
      // Ensure specific accordion is open to show result, though now all are open by default
      if (!activeAccordions.includes('peopleAnimals')) {
         toggleAccordion('peopleAnimals');
      }
    }, 1000);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setInputs(prev => ({ ...prev, [name]: value }));
    setActivePreset(null); // Manual change deselects preset
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

  const toggleAccordion = (section: string) => {
    setActiveAccordions(prev => 
      prev.includes(section) 
        ? prev.filter(i => i !== section) 
        : [...prev, section]
    );
  };

  return (
    <div className="min-h-screen font-sans flex items-center justify-center p-4 relative z-10">
      <div className="max-w-7xl w-full grid grid-cols-1 xl:grid-cols-12 gap-6">
        
        {/* Left Sidebar */}
        <div className="xl:col-span-5 space-y-4">
          <div className="bg-slate-800/40 backdrop-blur-xl p-6 rounded-3xl border border-slate-700/50 shadow-2xl flex flex-col h-full max-h-[92vh] relative">
            <div className="flex items-center justify-between mb-6 flex-shrink-0">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-gradient-to-br from-purple-500/30 to-blue-500/30 rounded-xl border border-white/10 shadow-inner">
                  <Music className="w-6 h-6 text-purple-300" />
                </div>
                <div>
                  <h1 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 tracking-tight">Lofi Studio</h1>
                  <p className="text-xs text-slate-400 font-medium tracking-wide">AI Mood & Prompt Generator</p>
                </div>
              </div>
              <button onClick={handleReset} className="text-xs font-bold flex items-center text-slate-400 hover:text-white transition-colors bg-slate-700/40 hover:bg-slate-700/60 px-3 py-1.5 rounded-full border border-slate-600/50">
                 <RotateCcw className="w-3.5 h-3.5 mr-1.5" /> 초기화
               </button>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-4 pb-32">
              
              {/* Quick Presets */}
              <div className="mb-2">
                 <div className="flex items-center justify-between mb-3 px-1">
                    <div className="flex items-center text-xs font-bold text-slate-400">
                      <Zap className="w-3 h-3 mr-1.5 text-yellow-400" /> 퀵 프리셋 (Quick Presets)
                    </div>
                 </div>
                 
                 {/* Category Tabs */}
                 <div className="flex space-x-2 mb-3 px-1 overflow-x-auto custom-scrollbar pb-1">
                   {[
                     { id: 'all', label: '전체' },
                     { id: 'daily', label: '일상' },
                     { id: 'travel', label: '여행/야외' },
                     { id: 'season', label: '계절' },
                   ].map((cat) => (
                     <button
                       key={cat.id}
                       onClick={() => setActiveCategory(cat.id as PresetCategory | 'all')}
                       className={`px-3 py-1 text-[10px] rounded-full font-bold whitespace-nowrap transition-all ${
                         activeCategory === cat.id 
                           ? 'bg-slate-200 text-slate-900 shadow-md' 
                           : 'bg-slate-900/40 text-slate-500 hover:bg-slate-800 border border-slate-700/50'
                       }`}
                     >
                       {cat.label}
                     </button>
                   ))}
                 </div>

                 {/* Updated: 2-row grid layout for presets with filtering */}
                 <div className="grid grid-rows-2 grid-flow-col gap-2 overflow-x-auto pb-2 custom-scrollbar snap-x min-h-[90px]">
                    {filteredPresets.map((preset, idx) => (
                      <button 
                        key={idx}
                        onClick={() => applyPreset(preset.data)}
                        className={`snap-start flex-shrink-0 flex items-center space-x-2 border px-3 py-2 rounded-xl transition-all group whitespace-nowrap ${
                          activePreset === preset.label 
                            ? 'bg-purple-900/60 border-purple-400 shadow-[0_0_10px_rgba(168,85,247,0.3)]' 
                            : 'bg-slate-900/60 hover:bg-slate-800 border-slate-700 hover:border-purple-500/50'
                        }`}
                      >
                         <span className="text-lg group-hover:scale-110 transition-transform">{preset.emoji}</span>
                         <span className={`text-xs font-medium group-hover:text-white ${activePreset === preset.label ? 'text-white' : 'text-slate-300'}`}>{preset.label}</span>
                      </button>
                    ))}
                    {filteredPresets.length === 0 && (
                      <div className="col-span-full row-span-2 flex items-center justify-center text-xs text-slate-500 italic p-4 w-full">
                        해당 카테고리의 프리셋이 없습니다.
                      </div>
                    )}
                 </div>
              </div>

              {/* Analysis Tools */}
              <div className="space-y-3">
                <div className="bg-gradient-to-br from-slate-900/60 to-slate-800/40 p-1 rounded-2xl border border-purple-500/20 shadow-lg">
                  <div className="p-3">
                    <label className="flex items-center text-xs font-bold text-purple-300 uppercase tracking-wider mb-2.5">
                      <FileText className="w-3.5 h-3.5 mr-2" /> 가사 / 텍스트 분석
                    </label>
                    <div className="relative">
                      <textarea 
                        value={lyrics} 
                        onChange={(e) => setLyrics(e.target.value)} 
                        placeholder="예: 십자가가 보이는 교회 앞..." 
                        className="w-full bg-slate-950/50 border border-slate-700 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-purple-500 focus:bg-slate-900 transition-all placeholder-slate-600 mb-2 h-16 resize-none text-slate-200 shadow-inner" 
                      />
                      <button onClick={analyzeLyricsHandler} disabled={isAnalyzing || !lyrics.trim()} className="absolute right-2 bottom-4 p-1.5 bg-purple-500/20 hover:bg-purple-500 text-purple-300 hover:text-white rounded-lg transition-colors disabled:opacity-0">
                         {isAnalyzing ? <RefreshCw className="w-3 h-3 animate-spin" /> : <ArrowRight className="w-3 h-3" />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-slate-900/60 to-slate-800/40 p-1 rounded-2xl border border-blue-500/20 shadow-lg">
                   <div className="p-3">
                    <label className="flex items-center text-xs font-bold text-blue-300 uppercase tracking-wider mb-2.5">
                      <ImageIcon className="w-3.5 h-3.5 mr-2" /> 이미지 스타일 벤치마킹
                    </label>
                    <div className="flex items-center space-x-2">
                      <div 
                        onClick={() => fileInputRef.current?.click()}
                        className={`flex-1 bg-slate-950/50 border border-slate-700 border-dashed rounded-xl h-16 flex items-center justify-center cursor-pointer hover:border-blue-500 hover:bg-slate-900/80 transition-all group relative overflow-hidden ${benchmarkImage ? 'border-blue-500/50' : ''}`}
                      >
                        <input 
                          type="file" 
                          ref={fileInputRef} 
                          onChange={handleImageUpload} 
                          accept="image/*" 
                          className="hidden" 
                        />
                        {benchmarkImage ? (
                          <>
                             <img src={benchmarkImage} alt="Benchmark" className="w-full h-full object-cover opacity-50 blur-[1px] group-hover:blur-none transition-all" />
                             <div className="absolute inset-0 flex items-center justify-center bg-black/40 group-hover:bg-transparent transition-colors">
                                <span className="text-[10px] text-white font-medium bg-black/50 px-2 py-1 rounded-full backdrop-blur-sm">이미지 변경</span>
                             </div>
                          </>
                        ) : (
                          <div className="text-center">
                            <Upload className="w-5 h-5 text-slate-500 mx-auto mb-1.5 group-hover:text-blue-400 group-hover:scale-110 transition-transform" />
                            <span className="text-[10px] text-slate-500 group-hover:text-blue-300 font-medium">클릭하여 이미지 업로드</span>
                          </div>
                        )}
                      </div>
                      <button 
                        onClick={analyzeImageBenchmarkHandler} 
                        disabled={isImageBenchmarking || !benchmarkImage} 
                        className={`h-16 w-16 rounded-xl flex items-center justify-center transition-all shadow-lg ${isImageBenchmarking ? 'bg-slate-800 text-slate-500' : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-900/20'}`}
                      >
                        {isImageBenchmarking ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Wand2 className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Accordion Forms */}
              <div className="space-y-2.5">
                {[
                  { id: 'artStyle', label: '아트 스타일', icon: <Palette className="w-3.5 h-3.5 mr-2" />, color: 'text-green-300' },
                  { id: 'peopleAnimals', label: '인물 및 동물', icon: <User className="w-3.5 h-3.5 mr-2" />, color: 'text-pink-300' },
                  { id: 'moodPlace', label: '분위기 및 장소', icon: <Sliders className="w-3.5 h-3.5 mr-2" />, color: 'text-purple-300' },
                  { id: 'objects', label: '오브젝트', icon: <Coffee className="w-3.5 h-3.5 mr-2" />, color: 'text-amber-300' },
                  { id: 'timeWeather', label: '시간 및 날씨', icon: <Moon className="w-3.5 h-3.5 mr-2" />, color: 'text-indigo-300' },
                ].map((section) => (
                  <div key={section.id} className="border border-slate-700/50 rounded-xl overflow-hidden bg-slate-900/40 backdrop-blur-sm transition-all hover:border-slate-600/80">
                    <button onClick={() => toggleAccordion(section.id)} className={`w-full flex items-center justify-between p-3.5 hover:bg-white/5 transition-colors text-xs font-bold uppercase tracking-wider ${section.color}`}>
                      <div className="flex items-center">{section.icon} {section.label}</div>
                      {activeAccordions.includes(section.id) ? <ChevronUp className="w-3.5 h-3.5 opacity-70" /> : <ChevronDown className="w-3.5 h-3.5 opacity-70" />}
                    </button>
                    {activeAccordions.includes(section.id) && (
                      <div className="p-3.5 border-t border-slate-700/30 bg-black/20 animate-in slide-in-from-top-1 duration-200">
                         {/* Form Content Switch */}
                         {section.id === 'artStyle' && (
                           <div className="grid grid-cols-2 gap-2">
                             {Object.entries(ART_STYLES).map(([key, style]) => (
                               <button key={key} onClick={() => { setInputs(prev => ({...prev, artStyle: key})); setActivePreset(null); }} className={`py-2.5 px-3 text-xs text-left rounded-lg border transition-all ${inputs.artStyle === key ? 'bg-green-500/10 border-green-500/50 text-green-300 font-bold shadow-[0_0_10px_rgba(34,197,94,0.1)]' : 'bg-slate-800/50 border-slate-600/50 text-slate-400 hover:bg-slate-800'}`}>
                                 {style.label}
                               </button>
                             ))}
                           </div>
                         )}
                         {section.id === 'peopleAnimals' && (
                           <div className="space-y-3">
                              <div>
                                <label className="flex items-center text-[10px] font-bold text-slate-500 mb-1.5">인물 (CHARACTER)</label>
                                <input type="text" name="people" value={inputs.people} onChange={handleInputChange} placeholder="예: 학생, 소녀" className="w-full bg-slate-900/50 border border-slate-600/50 rounded-lg px-3 py-2.5 text-xs focus:border-pink-500 outline-none text-slate-200 transition-colors" />
                              </div>
                              <div>
                                <label className="flex items-center text-[10px] font-bold text-slate-500 mb-1.5">동물 (ANIMAL)</label>
                                <input type="text" name="animals" value={inputs.animals} onChange={handleInputChange} placeholder="예: 고양이, 강아지" className="w-full bg-slate-900/50 border border-slate-600/50 rounded-lg px-3 py-2.5 text-xs focus:border-pink-500 outline-none text-slate-200 transition-colors" />
                              </div>
                           </div>
                         )}
                         {section.id === 'moodPlace' && (
                           <div className="space-y-3">
                              <div>
                                <label className="block text-[10px] font-bold text-slate-500 mb-1.5">분위기 (MOOD)</label>
                                <input type="text" name="mood" value={inputs.mood} onChange={handleInputChange} placeholder="예: 밤샘 공부, 몽환적인" className="w-full bg-slate-900/50 border border-slate-600/50 rounded-lg px-3 py-2.5 text-xs focus:border-purple-500 outline-none text-slate-200 transition-colors" />
                              </div>
                              <div>
                                <label className="block text-[10px] font-bold text-slate-500 mb-1.5">장소 (LOCATION)</label>
                                <input type="text" name="location" value={inputs.location} onChange={handleInputChange} placeholder="예: 창가, 작은 아파트 방" className="w-full bg-slate-900/50 border border-slate-600/50 rounded-lg px-3 py-2.5 text-xs focus:border-blue-500 outline-none text-slate-200 transition-colors" />
                              </div>
                           </div>
                         )}
                         {section.id === 'objects' && (
                           <input type="text" name="objects" value={inputs.objects} onChange={handleInputChange} placeholder="예: 노트북, 커피, 고양이" className="w-full bg-slate-900/50 border border-slate-600/50 rounded-lg px-3 py-2.5 text-xs focus:border-amber-500 outline-none text-slate-200 transition-colors" />
                         )}
                         {section.id === 'timeWeather' && (
                           <div className="grid grid-cols-2 gap-3">
                             <div>
                               <label className="block text-[10px] font-bold text-slate-500 mb-1.5">시간 (TIME)</label>
                               <select name="time" value={inputs.time} onChange={handleInputChange} className="w-full bg-slate-900/50 border border-slate-600/50 rounded-lg px-2 py-2.5 text-xs outline-none cursor-pointer text-slate-200 transition-colors appearance-none">
                                 <option value="">선택 안함</option>
                                 <option value="새벽">새벽</option>
                                 <option value="밤">밤</option>
                                 <option value="늦은 오후">늦은 오후</option>
                                 <option value="아침">아침</option>
                               </select>
                             </div>
                             <div>
                               <label className="block text-[10px] font-bold text-slate-500 mb-1.5">날씨 (WEATHER)</label>
                               <select name="weather" value={inputs.weather} onChange={handleInputChange} className="w-full bg-slate-900/50 border border-slate-600/50 rounded-lg px-2 py-2.5 text-xs outline-none cursor-pointer text-slate-200 transition-colors appearance-none">
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
                    )}
                  </div>
                ))}

                <div className="pt-3 pb-1">
                  <label className="flex items-center text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5">
                    <Monitor className="w-3.5 h-3.5 mr-2" /> 화면 비율
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {[{ label: '16:9', value: '16:9' }, { label: '9:16', value: '9:16' }, { label: '1:1', value: '1:1' }, { label: '4:5', value: '4:5' }].map((option) => (
                      <button key={option.value} onClick={() => setInputs(prev => ({ ...prev, ratio: option.value }))} className={`py-2 px-1 text-[11px] font-medium rounded-lg border transition-all ${inputs.ratio === option.value ? 'bg-slate-200 text-slate-900 border-white shadow-lg' : 'bg-slate-900/50 border-slate-700 text-slate-400 hover:bg-slate-800'}`}>
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Fixed Footer Buttons */}
            <div className="absolute bottom-0 left-0 w-full p-5 bg-slate-900/95 backdrop-blur-xl rounded-b-3xl border-t border-slate-700/50 flex flex-col gap-2.5 z-20">
              <button 
                onClick={() => handleGenerate()} 
                disabled={isGeneratingPrompt}
                className={`w-full py-3.5 bg-gradient-to-r from-purple-600 via-pink-600 to-red-500 bg-size-200 hover:bg-right rounded-xl font-black text-white shadow-lg shadow-purple-900/40 flex items-center justify-center transition-all duration-500 transform ${!isGeneratingPrompt ? 'hover:scale-[1.01] hover:shadow-purple-500/20' : 'opacity-80 cursor-wait'}`}
              >
                {isGeneratingPrompt ? (
                  <>
                     <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                     <span>프롬프트 번역 및 생성 중...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2 fill-current" />
                    <span>프롬프트 생성 (GENERATE)</span>
                  </>
                )}
              </button>
              
              <button 
                onClick={handleAutoGenerate} 
                disabled={isAutoGenerating}
                className="w-full py-3 bg-slate-800/80 hover:bg-slate-700 border border-slate-600/50 rounded-xl font-bold text-indigo-300 flex items-center justify-center transition-all text-sm group"
                title="프리셋에 없는 독특하고 창의적인 컨셉을 랜덤으로 생성합니다."
              >
                {isAutoGenerating ? (
                  <RefreshCw className="w-3.5 h-3.5 mr-2 animate-spin" />
                ) : (
                  <Dice5 className="w-4 h-4 mr-2 group-hover:rotate-180 transition-transform duration-500" />
                )}
                {isAutoGenerating ? "AI가 상상하는 중..." : "AI 랜덤 창작 (Unique & Creative)"}
              </button>
            </div>
          </div>
        </div>

        {/* Right Result Area */}
        <div className="xl:col-span-7 flex flex-col space-y-4">
          <div className="bg-slate-950/80 backdrop-blur-xl rounded-3xl border border-slate-800 shadow-2xl relative overflow-hidden group flex-1 flex flex-col max-h-[92vh]">
             {/* Decorative Gradient Line */}
             <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 opacity-60"></div>
             
             {/* Content Container */}
             <div className="h-full bg-slate-900/40 rounded-3xl p-6 flex flex-col relative z-10">
                <div className="flex justify-between items-center mb-4 flex-shrink-0 border-b border-white/5 pb-4">
                  <div className="flex items-center space-x-4">
                    <button 
                      onClick={() => setShowHistory(false)}
                      className={`text-sm font-bold uppercase tracking-widest flex items-center transition-colors ${!showHistory ? 'text-white border-b-2 border-purple-500 pb-1' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                      <Terminal className="w-4 h-4 mr-2" /> Prompt
                    </button>
                    <button 
                      onClick={() => setShowHistory(true)}
                      className={`text-sm font-bold uppercase tracking-widest flex items-center transition-colors ${showHistory ? 'text-white border-b-2 border-blue-500 pb-1' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                      <History className="w-4 h-4 mr-2" /> History
                      {history.length > 0 && <span className="ml-2 bg-slate-800 text-slate-400 text-[10px] px-1.5 py-0.5 rounded-full">{history.length}</span>}
                    </button>
                  </div>
                  {!showHistory && <div className="text-xs text-slate-600 font-mono">Len: {generatedPrompt.length}</div>}
                </div>

                {showHistory ? (
                   // History View
                   <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-3">
                     {history.length === 0 ? (
                       <div className="h-full flex flex-col items-center justify-center text-slate-600 space-y-3 opacity-60">
                         <History className="w-12 h-12" />
                         <p className="text-sm">저장된 히스토리가 없습니다.</p>
                       </div>
                     ) : (
                       history.map((item) => (
                         <div key={item.id} className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-4 hover:border-blue-500/30 transition-colors group">
                           <div className="flex justify-between items-start mb-2">
                             <div className="flex items-center text-[10px] text-slate-500 space-x-2">
                               <Clock className="w-3 h-3" />
                               <span>{new Date(item.timestamp).toLocaleString()}</span>
                               <span className="bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded text-[9px] uppercase">{item.inputs.mood || 'N/A'}</span>
                             </div>
                             <button onClick={() => restoreHistory(item)} className="text-xs bg-blue-500/10 text-blue-400 hover:bg-blue-500 hover:text-white px-2 py-1 rounded transition-colors">
                               복원
                             </button>
                           </div>
                           <p className="text-xs text-slate-300 font-mono line-clamp-2 opacity-80 group-hover:opacity-100">{item.prompt}</p>
                         </div>
                       ))
                     )}
                   </div>
                ) : (
                   // Prompt View
                   <>
                    <div className="flex-1 bg-black/40 rounded-xl p-5 mb-4 border border-slate-700/50 font-mono text-sm leading-relaxed overflow-y-auto custom-scrollbar text-slate-300 shadow-inner relative">
                      {generatedPrompt ? (
                        <>
                          <div className="absolute top-2 right-2 flex space-x-1">
                             <div className="w-2.5 h-2.5 rounded-full bg-red-500/50"></div>
                             <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/50"></div>
                             <div className="w-2.5 h-2.5 rounded-full bg-green-500/50"></div>
                          </div>
                          <span className="text-green-500 font-bold select-none mr-2">$</span>
                          {generatedPrompt}
                          <span className="animate-pulse inline-block w-2 h-4 ml-1 bg-green-500/80 align-middle"></span>
                        </>
                      ) : (
                        <div className="h-full flex flex-col items-center justify-center text-slate-600 space-y-4">
                          <div className="p-4 bg-slate-900/50 rounded-full border border-slate-800">
                             <Terminal className="w-8 h-8 opacity-50" />
                          </div>
                          <div className="text-center">
                            <p className="text-sm font-medium text-slate-500 mb-1">프롬프트가 생성되지 않았습니다</p>
                            <p className="text-xs text-slate-600">
                              좌측 옵션을 선택하고 <span className="text-purple-400 font-bold">생성 버튼</span>을 눌러주세요.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex-shrink-0 space-y-4">
                      <button onClick={copyToClipboard} disabled={!generatedPrompt} className={`w-full py-3.5 rounded-xl font-bold text-sm transition-all duration-300 flex items-center justify-center space-x-2 shadow-lg ${copied ? 'bg-green-500/20 text-green-400 border border-green-500/50' : 'bg-purple-600 hover:bg-purple-500 text-white border border-purple-500/50 hover:shadow-purple-500/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none'}`}>
                        {copied ? <><Save className="w-4 h-4" /><span>클립보드에 복사 완료!</span></> : <><Copy className="w-4 h-4" /><span>프롬프트 복사 (Copy Prompt)</span></>}
                      </button>

                      <div className="relative group">
                         <input type="text" value={userFeedback} onChange={(e) => setUserFeedback(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && !isRefining && handleSmartFeedback()} disabled={isRefining || !generatedPrompt} placeholder="AI에게 수정 요청 (예: 좀 더 어둡게, 사람 빼줘, 비 오게 해줘)" className="w-full bg-slate-800/50 border border-slate-600/50 rounded-xl pl-4 pr-12 py-3.5 text-xs focus:border-purple-500 focus:bg-slate-800 outline-none text-white placeholder-slate-500 disabled:opacity-50 transition-all" />
                         <button onClick={handleSmartFeedback} disabled={isRefining || !generatedPrompt} className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg transition-all ${isRefining ? 'text-slate-500' : 'bg-purple-500/20 text-purple-400 hover:bg-purple-500 hover:text-white'}`}>
                           {isRefining ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Wand2 className="w-3.5 h-3.5" />}
                         </button>
                      </div>
                    </div>
                   </>
                )}
             </div>
          </div>

          <div className="bg-slate-900/60 backdrop-blur-md rounded-2xl border border-slate-700/30 p-5 flex-shrink-0 shadow-xl">
            <h3 className="text-xs font-bold text-slate-400 uppercase mb-3 flex items-center tracking-wider">
              <MessageSquare className="w-3.5 h-3.5 mr-2" /> 프롬프트 설명 (Korean Analysis)
            </h3>
            <div className="bg-slate-950/50 rounded-xl p-4 text-sm text-slate-300 leading-relaxed border border-white/5 whitespace-pre-line min-h-[100px] shadow-inner">
              {koreanExplanation || <span className="text-slate-600 italic">프롬프트가 생성되면 이곳에 상세 설명이 표시됩니다.</span>}
            </div>
            
            <div className="mt-3 flex flex-wrap gap-2">
              {inputs.customModifiers.map((mod, idx) => (
                <span key={idx} className="text-[10px] bg-purple-500/10 text-purple-300 px-2.5 py-1 rounded-full border border-purple-500/20 truncate max-w-[300px] hover:bg-purple-500/20 transition-colors cursor-help" title={mod}>
                  ✨ {mod}
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