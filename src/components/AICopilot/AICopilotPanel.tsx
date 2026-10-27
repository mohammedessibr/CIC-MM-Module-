import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, X, Sparkles } from 'lucide-react';
import { parseUserInput, type CopilotResponse } from './AICopilotLogic';
import { SuggestedPOCard, MissingDataCard, AlternativeVendorsCard } from './CopilotCards';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  responseParams?: CopilotResponse;
}

export const AICopilotPanel: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Hello! I am SAP Joule, your embedded MM Copilot. I can assist you with automating tasks like PR to PO creation. What would you like to do today?',
    }
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, isOpen]);

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;

    const newUserMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage,
    };

    setMessages((prev) => [...prev, newUserMsg]);
    setInputMessage('');
    setIsTyping(true);

    // Simulate API delay
    setTimeout(() => {
      const response = parseUserInput(newUserMsg.content);
      
      const newBotMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.message,
        responseParams: response,
      };

      setMessages((prev) => [...prev, newBotMsg]);
      setIsTyping(false);
    }, 1200);
  };

  const handleCardAction = (action: string, payload?: any) => {
    let msg = '';
    if (action === 'select_vendor') {
      msg = `I'll select ${payload} as the vendor.`;
    } else if (action === 'submit_po') {
      msg = "Let's submit this Purchase Order.";
    }

    if (msg) {
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'user', content: msg }]);
      setIsTyping(true);
      
      setTimeout(() => {
        if (action === 'select_vendor') {
            const updatedResponse = parseUserInput(`Create PO for laptops IT department from ${payload}`);
            setMessages(prev => [...prev, {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: updatedResponse.message,
                responseParams: updatedResponse
            }]);
        } else if (action === 'submit_po') {
            setMessages(prev => [...prev, {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: "Purchase Order successfully created! (Simulated ME21N). Document Number: 4500021342"
            }]);
        }
        setIsTyping(false);
      }, 1500);
    }
  };

  if (!isOpen) {
    return (
      <button
        type="button"
        aria-label="Open SAP Joule copilot"
        onClick={() => setIsOpen(true)}
        className="group fixed bottom-6 right-6 z-50 flex items-center justify-center rounded-full bg-[#0478d8] p-4 text-white shadow-lg shadow-blue-950/30 transition-transform hover:scale-105 hover:bg-[#0367bb]"
      >
        <Sparkles size={24} className="group-hover:animate-pulse" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex h-[600px] w-[400px] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-lg border border-cyan-200/50 bg-white font-sans shadow-2xl shadow-blue-950/25 backdrop-blur-xl">
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between bg-gradient-to-r from-[#071121] via-[#07345f] to-[#0478d8] p-4 text-white">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-white/15 p-2 backdrop-blur-sm">
            <Bot size={20} className="text-blue-50" />
          </div>
          <div>
            <h2 className="font-semibold text-sm">SAP Joule</h2>
            <p className="text-xs text-blue-200">MM AI Procurement Copilot</p>
          </div>
        </div>
        <button 
          type="button"
          aria-label="Close SAP Joule copilot"
          onClick={() => setIsOpen(false)}
          className="rounded-lg p-1.5 text-blue-100 transition-colors hover:bg-white/10 hover:text-white"
        >
          <X size={20} />
        </button>
      </div>

      {/* Chat Area */}
      <div className="custom-scrollbar flex-1 space-y-4 overflow-y-auto bg-[#edf8ff] p-4">
        {messages.map((msg) => (
          <div 
            key={msg.id} 
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[85%] ${msg.role === 'user' ? 'order-1' : 'order-2'}`}>
              <div 
                className={`rounded-lg px-4 py-2.5 text-sm leading-relaxed ${
                  msg.role === 'user' 
                    ? 'rounded-br-sm bg-[#0478d8] text-white shadow-md shadow-blue-700/20' 
                    : 'rounded-bl-sm border border-sky-100 bg-white text-gray-800 shadow-sm'
                }`}
              >
                {msg.content}
              </div>
              
              {/* Dynamic Action Cards */}
              {msg.role === 'assistant' && msg.responseParams?.cardType === 'suggested_po' && (
                <div className="mt-2">
                  <SuggestedPOCard data={msg.responseParams.data} onAction={handleCardAction} />
                </div>
              )}
              {msg.role === 'assistant' && msg.responseParams?.cardType === 'missing_data' && (
                <div className="mt-2">
                  <MissingDataCard missingFields={msg.responseParams.missingFields} />
                </div>
              )}
              {msg.role === 'assistant' && msg.responseParams?.cardType === 'alternative_vendors' && (
                <div className="mt-2">
                  <AlternativeVendorsCard data={msg.responseParams.data} suggestedVendors={msg.responseParams.suggestedVendors} onAction={handleCardAction} />
                </div>
              )}
            </div>
            {/* Avatar for bot */}
            {msg.role === 'assistant' && (
               <div className="order-1 mr-2 mt-auto flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-sky-200 bg-white shadow-sm">
                 <Bot size={16} className="text-[#0478d8]" />
               </div>
            )}
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
             <div className="mr-2 mt-auto flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-sky-200 bg-white shadow-sm">
                 <Bot size={16} className="text-[#0478d8]" />
             </div>
            <div className="flex items-center gap-1 rounded-lg rounded-bl-sm border border-sky-100 bg-white p-3 shadow-sm">
              <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
              <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
              <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="shrink-0 border-t border-sky-100 bg-white p-3">
        <div className="flex items-end gap-2 rounded-lg border border-sky-100 bg-[#f5fbff] p-1 shadow-inner transition-all focus-within:border-[#0478d8] focus-within:ring-2 focus-within:ring-sky-300/40">
          <textarea
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder="Ask a procurement action..."
            className="max-h-32 min-h-[44px] flex-1 resize-none border-none bg-transparent px-3 py-2.5 text-sm text-gray-800 outline-none placeholder-gray-400 focus:ring-0"
            rows={inputMessage.split('\n').length > 1 ? Math.min(inputMessage.split('\n').length, 4) : 1}
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || isTyping}
            className="mb-0.5 mr-0.5 rounded-lg bg-[#0478d8] p-2.5 text-white transition-colors hover:bg-[#0367bb] disabled:bg-gray-200 disabled:text-gray-400"
          >
            <Send size={18} />
          </button>
        </div>
        <div className="text-center mt-2">
            <span className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold flex justify-center items-center gap-1">
               <Sparkles size={10} /> Powered by SAP Joule
            </span>
        </div>
      </div>
    </div>
  );
};
