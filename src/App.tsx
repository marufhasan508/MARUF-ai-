/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  TrendingUp, 
  TrendingDown, 
  Upload, 
  MessageSquare, 
  Terminal, 
  AlertTriangle, 
  ChevronRight, 
  Send,
  X,
  FileImage,
  RefreshCcw,
  Zap
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { analyzeChart, chatAboutTrading, translateText } from './services/gemini';
import { Message } from './types';

export default function App() {
  const [image, setImage] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string>('');
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('INITIATING ENGINE...');
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isChatting, setIsChatting] = useState(false);
  const [language, setLanguage] = useState('English');
  const [isTranslating, setIsTranslating] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const loadingMessages = [
    'CONNECTING TO LIQUIDITY POOLS...',
    'SCANNING CANDLE STRUCTURE...',
    'DETECTING SUPPORT & RESISTANCE...',
    'ANALYZING ORDER BLOCKS...',
    'CALCULATING MOMENTUM...',
    'GENERATING FINAL SIGNAL...'
  ];

  useEffect(() => {
    let msgIndex = 0;
    let interval: any;
    if (isAnalyzing) {
      setLoadingMessage(loadingMessages[0]);
      interval = setInterval(() => {
        msgIndex = (msgIndex + 1) % loadingMessages.length;
        setLoadingMessage(loadingMessages[msgIndex]);
      }, 1500);
    }
    return () => clearInterval(interval);
  }, [isAnalyzing]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = (reader.result as string).split(',')[1];
        setImage(reader.result as string);
        setMimeType(file.type);
        triggerAnalysis(base64, file.type);
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerAnalysis = async (base64: string, type: string) => {
    setIsAnalyzing(true);
    setAnalysis(null);
    try {
      const result = await analyzeChart(base64, type);
      setAnalysis(result || "Failed to get analysis. Please try again.");
    } catch (err) {
      console.error(err);
      setAnalysis("Error analyzing chart. Check your connection or image quality.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleLanguageChange = async (newLang: string) => {
    if (!analysis || isTranslating || newLang === language) return;
    
    setIsTranslating(true);
    setLanguage(newLang);
    try {
      const translated = await translateText(analysis, newLang);
      setAnalysis(translated || analysis);
    } catch (err) {
      console.error(err);
    } finally {
      setIsTranslating(false);
    }
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputValue.trim() || isChatting) return;

    const userMsg = inputValue.trim();
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setInputValue('');
    setIsChatting(true);

    try {
      const history = messages.map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      }));
      const response = await chatAboutTrading(userMsg, history);
      setMessages(prev => [...prev, { role: 'model', text: response || "I'm having trouble thinking right now." }]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { role: 'model', text: "Sorry, I couldn't process that request." }]);
    } finally {
      setIsChatting(false);
    }
  };

  const clearImage = () => {
    setImage(null);
    setAnalysis(null);
    setMimeType('');
  };

  return (
    <div className="min-h-screen bg-[#0B0E11] text-[#EAECEF] font-sans overflow-hidden flex flex-col">
      {/* Header */}
      <header className="h-16 border-b border-[#2B2F36] flex items-center justify-between px-6 bg-[#181A20] shrink-0">
        <div className="flex items-center gap-3">
          <div className="bg-[#F0B90B] p-2 rounded-lg">
            <TrendingUp className="text-[#181A20] w-5 h-5" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">MONEY <span className="text-[#F0B90B]">HUNTER</span></h1>
        </div>
        <div className="flex items-center gap-4 text-sm font-medium">
          <div className="flex items-center gap-1.5 px-3 py-1 bg-[#2B3139] rounded-full text-[#0ECB81] border border-[#0ECB81]/20">
            <div className="w-1.5 h-1.5 rounded-full bg-[#0ECB81] animate-pulse" />
            LIVE MARKET CONNECTED
          </div>
        </div>
      </header>

      {/* Main Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Section: Analysis & Upload */}
        <main className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 scrollbar-hide">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            
            {/* Chart Upload Card */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-[#181A20] border border-[#2B2F36] rounded-2xl overflow-hidden shadow-2xl"
              id="upload-card"
            >
              <div className="p-4 border-b border-[#2B2F36] bg-[#1E2329] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Terminal className="text-[#F0B90B] w-4 h-4" />
                  <span className="text-xs font-mono uppercase tracking-widest text-[#848E9C]">Chart Ingestor</span>
                </div>
                {image && (
                  <button 
                    onClick={clearImage}
                    className="p-1 hover:bg-[#2B3139] rounded-md transition-colors text-[#848E9C]"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              
              <div className="p-6">
                {!image ? (
                  <label className="border-2 border-dashed border-[#2B3139] hover:border-[#F0B90B] rounded-xl cursor-pointer py-16 flex flex-col items-center justify-center gap-4 group transition-all">
                    <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
                    <div className="w-16 h-16 rounded-full bg-[#2B3139] group-hover:bg-[#F0B90B]/10 flex items-center justify-center transition-colors">
                      <Upload className="w-8 h-8 text-[#848E9C] group-hover:text-[#F0B90B]" />
                    </div>
                    <div className="text-center">
                      <p className="font-semibold text-lg">Upload Trading Chart</p>
                      <p className="text-[#848E9C] text-sm">Drag or click to analyze patterns</p>
                    </div>
                    <div className="mt-4 flex gap-2 text-[10px] text-[#474D57] font-mono">
                      <span className="px-2 py-1 bg-[#1E2329] rounded">PNG</span>
                      <span className="px-2 py-1 bg-[#1E2329] rounded">JPG</span>
                      <span className="px-2 py-1 bg-[#1E2329] rounded">WEBP</span>
                    </div>
                  </label>
                ) : (
                  <div className="space-y-4">
                    <div className="relative rounded-xl overflow-hidden border border-[#2B2F36] aspect-video animate-in fade-in duration-500 bg-[#0B0E11]">
                      <img src={image} alt="Uploaded chart" className="w-full h-full object-contain" />
                      {isAnalyzing && (
                        <div className="absolute inset-0 bg-[#0B0E11]/80 backdrop-blur-md flex flex-col items-center justify-center gap-4">
                          <div className="relative">
                            <div className="w-16 h-16 border-4 border-[#F0B90B]/20 border-t-[#F0B90B] rounded-full animate-spin" />
                            <Zap className="absolute inset-0 m-auto w-6 h-6 text-[#F0B90B] animate-pulse" />
                          </div>
                          <p className="text-[10px] font-mono tracking-[0.2em] text-[#F0B90B] uppercase font-bold text-center px-4">
                            {loadingMessage}
                          </p>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-3">
                      <button 
                        onClick={() => {
                          const base64 = image.split(',')[1];
                          triggerAnalysis(base64, mimeType);
                        }}
                        className="flex-1 bg-[#F0B90B] text-[#181A20] h-11 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-[#D4A30A] transition-colors"
                      >
                        <RefreshCcw className="w-4 h-4" /> RE-ANALYZE
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Analysis Results Card */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-[#181A20] border border-[#2B2F36] rounded-2xl flex flex-col min-h-[400px] shadow-2xl overflow-hidden"
              id="analysis-card"
            >
              <div className="p-4 border-b border-[#2B2F36] bg-[#1E2329] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="text-[#F0B90B] w-4 h-4" />
                  <span className="text-xs font-mono uppercase tracking-widest text-[#848E9C]">Intelligence Report</span>
                </div>
                
                {analysis && (
                  <div className="flex items-center gap-2">
                    <select 
                      value={language}
                      onChange={(e) => handleLanguageChange(e.target.value)}
                      disabled={isTranslating}
                      className="bg-[#2B3139] text-[#EAECEF] text-[10px] px-2 py-1 rounded border border-[#474D57] outline-none cursor-pointer disabled:opacity-50"
                    >
                      <option value="English">English</option>
                      <option value="Bengali">বাংলা (Bengali)</option>
                      <option value="Hindi">हिन्दी (Hindi)</option>
                    </select>
                    {isTranslating && <RefreshCcw className="w-3 h-3 text-[#F0B90B] animate-spin" />}
                  </div>
                )}
              </div>
              
              <div className="flex-1 p-6 overflow-y-auto custom-scrollbar">
                {!analysis && !isAnalyzing ? (
                  <div className="h-full flex flex-col items-center justify-center text-[#848E9C] opacity-40">
                    <FileImage className="w-12 h-12 mb-4" />
                    <p className="text-sm text-center">Wait for chart input to<br/>generate neural analysis</p>
                  </div>
                ) : analysis ? (
                  <AnimatePresence mode="wait">
                    <motion.div 
                      key={analysis}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="prose prose-invert max-w-none prose-sm text-[#EAECEF]"
                    >
                      <ReactMarkdown 
                        components={{
                          strong: ({node, ...props}) => <span className="font-bold text-[#F0B90B]" {...props} />,
                          h1: ({node, ...props}) => <h1 className="text-lg font-bold border-b border-[#2B2F36] pb-2 mb-4 uppercase tracking-tighter" {...props} />,
                          li: ({node, ...props}) => <li className="mb-1 list-none flex items-start gap-2 before:content-['▹'] before:text-[#F0B90B]" {...props} />,
                        }}
                      >
                        {analysis}
                      </ReactMarkdown>
                    </motion.div>
                  </AnimatePresence>
                ) : (
                  <div className="space-y-4">
                    <div className="h-4 bg-[#2B3139] rounded animate-pulse w-3/4" />
                    <div className="h-4 bg-[#2B3139] rounded animate-pulse w-1/2" />
                    <div className="h-4 bg-[#2B3139] rounded animate-pulse w-full" />
                    <div className="h-4 bg-[#2B3139] rounded animate-pulse w-2/3" />
                  </div>
                )}
              </div>
              
              <div className="p-4 bg-[#1E2329]/50 border-t border-[#2B2F36] text-[10px] text-[#474D57] italic">
                DISCLAIMER: This analysis is for educational purposes only. Markets are volatile. Trade at your own risk.
              </div>
            </motion.div>
          </div>

          {/* Footer */}
          <footer className="mt-auto pt-6 border-t border-[#2B2F36] flex flex-col gap-4 text-sm text-[#848E9C]">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-[#2B3139] flex items-center justify-center">
                    <Zap className="w-4 h-4 text-[#F0B90B]" />
                  </div>
                  <span className="font-semibold text-[#EAECEF]">Created by Maruf</span>
                </div>
                <a 
                  href="https://t.me/Xmaruf09" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 hover:text-[#0088cc] transition-colors group"
                >
                  <div className="w-5 h-5 flex items-center justify-center bg-[#0088cc]/10 rounded group-hover:bg-[#0088cc]/20">
                    <Send className="w-3 h-3 text-[#0088cc]" />
                  </div>
                  <span className="font-mono text-xs">contact:@Xmaruf09</span>
                </a>
              </div>

              <div className="flex flex-col gap-1 items-end">
                <span className="text-[10px] uppercase tracking-widest font-bold text-[#474D57]">Official Source</span>
                <a 
                  href="https://t.me/shooter_by_1x" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 hover:text-[#0088cc] transition-colors group"
                >
                  <span className="font-mono text-xs">Channel: shooter_by_1x</span>
                  <div className="w-5 h-5 flex items-center justify-center bg-[#0088cc]/10 rounded group-hover:bg-[#0088cc]/20">
                    <Send className="w-3 h-3 text-[#0088cc]" />
                  </div>
                </a>
              </div>
            </div>
            
            <div className="text-center text-[10px] text-[#474D57] font-mono py-2 opacity-50">
              MONEY HUNTER ANALYTICS ENGINE v1.0.4 - SYSTEM SECURE
            </div>
          </footer>
        </main>

        {/* Right Section: Chat Interface */}
        <aside className="w-[380px] border-l border-[#2B2F36] bg-[#181A20] flex flex-col shrink-0 hidden xl:flex">
          <div className="p-4 border-b border-[#2B2F36] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-[#F0B90B]" />
              <h2 className="font-bold text-sm">TRADING CHAT AI</h2>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 custom-scrollbar">
            {messages.length === 0 && (
              <div className="text-center mt-12 px-6">
                <p className="text-[#848E9C] text-sm">Ask me anything about market strategies, candle patterns, or specific trades.</p>
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                <div className={`max-w-[90%] p-3 rounded-2xl text-sm leading-relaxed ${
                  m.role === 'user' 
                    ? 'bg-[#F0B90B] text-[#181A20] rounded-br-none font-medium' 
                    : 'bg-[#2B3139] text-[#EAECEF] rounded-bl-none'
                }`}>
                  <div className="prose prose-invert prose-xs max-w-none">
                    <ReactMarkdown>
                      {m.text}
                    </ReactMarkdown>
                  </div>
                </div>
              </div>
            ))}
            {isChatting && (
              <div className="flex items-start">
                <div className="bg-[#2B3139] p-3 rounded-2xl rounded-bl-none flex gap-1 items-center">
                  <div className="w-1 h-1 bg-[#848E9C] rounded-full animate-bounce [animation-delay:-0.3s]" />
                  <div className="w-1 h-1 bg-[#848E9C] rounded-full animate-bounce [animation-delay:-0.15s]" />
                  <div className="w-1 h-1 bg-[#848E9C] rounded-full animate-bounce" />
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <form onSubmit={handleSendMessage} className="p-4 border-t border-[#2B2F36] bg-[#1E2329]">
            <div className="relative">
              <input 
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Type your question..."
                className="w-full bg-[#2B3139] border border-transparent focus:border-[#F0B90B] rounded-xl py-3 pl-4 pr-12 outline-none text-sm transition-all text-[#EAECEF] placeholder:text-[#848E9C]"
                disabled={isChatting}
              />
              <button 
                type="submit"
                disabled={!inputValue.trim() || isChatting}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center bg-[#F0B90B] text-[#181A20] rounded-lg disabled:opacity-50 disabled:grayscale transition-all"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </form>
        </aside>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #181A20;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #2B3139;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #474D57;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
