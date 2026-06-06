import React, { useState, useRef, useEffect } from 'react';
import { Bot, X, Send, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const AiCopilot = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { id: 1, text: `Hello ${user?.user_metadata?.first_name || 'there'}! I'm your AI Procurement Copilot. How can I help you today?`, isBot: true }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    // Add user message
    const newMsg = { id: Date.now(), text: inputValue, isBot: false };
    setMessages(prev => [...prev, newMsg]);
    setInputValue('');
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      let botReply = "I can analyze vendor quotations, summarize RFQs, and help streamline your procurement workflow. I'm currently in demo mode!";
      
      if (newMsg.text.toLowerCase().includes('rfq')) {
        botReply = "I can help you draft a new RFQ or track your open ones. Want me to take you to the RFQ creation page?";
      } else if (newMsg.text.toLowerCase().includes('vendor')) {
        botReply = "Looking for vendors? Our database has hundreds of verified suppliers. You can filter them by category and rating on the Vendors page.";
      }

      setMessages(prev => [...prev, { id: Date.now() + 1, text: botReply, isBot: true }]);
      setIsTyping(false);
    }, 1500);
  };

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 z-50 p-4 rounded-full shadow-2xl transition-all duration-300 hover:scale-105 ${
          isOpen 
            ? 'bg-rose-500 hover:bg-rose-600 text-white rotate-90' 
            : 'bg-emerald-600 hover:bg-emerald-500 text-white hover:shadow-[0_0_20px_rgba(16,185,129,0.4)]'
        }`}
      >
        {isOpen ? <X size={24} className="-rotate-90 transition-transform" /> : <Bot size={28} />}
      </button>

      {/* Chat Window */}
      <div 
        className={`fixed bottom-24 right-6 z-50 w-80 sm:w-96 h-[500px] max-h-[70vh] liquid-glass rounded-2xl flex flex-col overflow-hidden transition-all duration-400 origin-bottom-right ${
          isOpen ? 'scale-100 opacity-100 translate-y-0' : 'scale-90 opacity-0 translate-y-10 pointer-events-none'
        }`}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-white/50 dark:bg-black/20">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Sparkles size={16} />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white leading-tight">AI Copilot</h3>
              <p className="text-[10px] uppercase tracking-wider font-semibold text-emerald-600 dark:text-emerald-500">Online</p>
            </div>
          </div>
          <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-gray-50/30 dark:bg-transparent">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.isBot ? 'justify-start' : 'justify-end'}`}>
              <div 
                className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                  msg.isBot 
                    ? 'bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-gray-800 dark:text-gray-200 shadow-sm rounded-tl-none' 
                    : 'bg-emerald-600 text-white shadow-md rounded-tr-none'
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))}
          
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl rounded-tl-none px-4 py-3 shadow-sm flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900/50">
          <form onSubmit={handleSend} className="relative flex items-center">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask Copilot anything..."
              className="w-full bg-gray-100 dark:bg-gray-800 border-transparent focus:bg-white dark:focus:bg-gray-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl pl-4 pr-12 py-3 text-sm text-gray-900 dark:text-white transition-all"
            />
            <button 
              type="submit" 
              disabled={!inputValue.trim()}
              className="absolute right-2 p-1.5 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-lg transition-colors disabled:opacity-50 disabled:hover:bg-transparent"
            >
              <Send size={18} />
            </button>
          </form>
        </div>
      </div>
    </>
  );
};

export default AiCopilot;
