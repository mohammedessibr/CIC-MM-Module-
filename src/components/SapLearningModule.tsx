import { useState, useMemo, useEffect, useRef } from 'react';
import {
  BookOpen,
  Layers,
  Network,
  ShoppingCart,
  Database,
  FileText,
  ArrowRightLeft,
  ClipboardCheck,
  Search,
  Menu,
  X,
  CheckCircle,
  Box,
  Truck,
  CreditCard,
  Settings,
  Users,
  Send,
  Sparkles,
  Hash,
  Info,
  Link,
  Printer,
  FileSearch,
  RefreshCw,
  MoveRight,
  ChevronDown,
} from 'lucide-react';

// --- DATA CONSTANTS ---

const SECTION_KEYS = {
  INTRO: 'intro',
  MODULES: 'modules',
  ORG_STRUCTURE: 'org_structure',
  P2P: 'p2p',
  MASTER_DATA: 'master_data',
  AGREEMENTS: 'agreements',
  MOVEMENT: 'movement',
  PHYSICAL_INV: 'physical_inv',
  T_CODES: 't_codes',
  QUIZ: 'quiz',
};

const NAV_ITEMS = [
  { id: SECTION_KEYS.INTRO, label: 'Intro to SAP', icon: BookOpen },
  { id: SECTION_KEYS.MODULES, label: 'SAP Modules', icon: Layers },
  { id: SECTION_KEYS.ORG_STRUCTURE, label: 'Org Structure', icon: Network },
  { id: SECTION_KEYS.P2P, label: 'Procure to Pay', icon: ShoppingCart },
  { id: SECTION_KEYS.MASTER_DATA, label: 'Master Data', icon: Database },
  { id: SECTION_KEYS.AGREEMENTS, label: 'Outline Agreements', icon: FileText },
  { id: SECTION_KEYS.MOVEMENT, label: 'Movement Types', icon: ArrowRightLeft },
  { id: SECTION_KEYS.PHYSICAL_INV, label: 'Physical Inventory', icon: ClipboardCheck },
  { id: SECTION_KEYS.T_CODES, label: 'T-Code Master List', icon: Hash },
  { id: SECTION_KEYS.QUIZ, label: 'Knowledge Check', icon: CheckCircle },
];

const T_CODE_DATABASE = [
  { code: 'ME51N', desc: 'Create Purchase Requisition', category: 'Procurement' },
  { code: 'ME52N', desc: 'Change Purchase Requisition', category: 'Procurement' },
  { code: 'ME53N', desc: 'Display Purchase Requisition', category: 'Procurement' },
  { code: 'ME21N', desc: 'Create Purchase Order', category: 'Procurement' },
  { code: 'ME22N', desc: 'Change Purchase Order', category: 'Procurement' },
  { code: 'ME23N', desc: 'Display Purchase Order', category: 'Procurement' },
  { code: 'MIGO', desc: 'Goods Receipt / Issue', category: 'Inventory' },
  { code: 'MIRO', desc: 'Invoice Verification', category: 'Finance/MM' },
  { code: 'MM01', desc: 'Create Material', category: 'Master Data' },
  { code: 'MM02', desc: 'Change Material', category: 'Master Data' },
  { code: 'MM03', desc: 'Display Material', category: 'Master Data' },
  { code: 'BP', desc: 'Maintain Business Partner', category: 'Master Data' },
  { code: 'ME11', desc: 'Create Info Record', category: 'Master Data' },
  { code: 'ME01', desc: 'Maintain Source List', category: 'Master Data' },
  { code: 'ME31K', desc: 'Create Contract', category: 'Agreements' },
  { code: 'ME31L', desc: 'Create Scheduling Agreement', category: 'Agreements' },
  { code: 'MI01', desc: 'Create Phys. Inv. Doc.', category: 'Inventory' },
  { code: 'MI04', desc: 'Enter Count', category: 'Inventory' },
  { code: 'MI07', desc: 'Post Differences', category: 'Inventory' },
];

// --- COMPONENTS ---

// ─── Markdown renderer for chat messages ──────────────────────────────────────
const renderChatMarkdown = (text: string) => {
  const lines = text.split('\n');
  const elements: React.ReactElement[] = [];
  let listItems: string[] = [];
  let isOrdered = false;
  let orderedStart = 1;

  const flushList = (key: string) => {
    if (listItems.length === 0) return;
    if (isOrdered) {
      elements.push(
        <ol key={key} start={orderedStart} className="list-decimal list-inside space-y-0.5 my-1 pl-1">
          {listItems.map((li, idx) => (
            <li key={idx} className="text-xs text-slate-700 leading-relaxed">{li}</li>
          ))}
        </ol>
      );
    } else {
      elements.push(
        <ul key={key} className="list-disc list-inside space-y-0.5 my-1 pl-1">
          {listItems.map((li, idx) => (
            <li key={idx} className="text-xs text-slate-700 leading-relaxed">{li}</li>
          ))}
        </ul>
      );
    }
    listItems = [];
  };

  const renderInline = (raw: string, key: number | string) => {
    const parts = raw.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
    return (
      <span key={key}>
        {parts.map((p, j) => {
          if (p.startsWith('**') && p.endsWith('**'))
            return <strong key={j} className="font-semibold text-slate-800">{p.slice(2, -2)}</strong>;
          if (p.startsWith('`') && p.endsWith('`'))
            return <code key={j} className="bg-slate-100 text-blue-700 font-mono text-[10px] px-1 py-0.5 rounded">{p.slice(1, -1)}</code>;
          return p;
        })}
      </span>
    );
  };

  lines.forEach((line, i) => {
    const key = `l-${i}`;
    const trimmed = line.trim();

    if (trimmed.startsWith('### ')) {
      flushList(`f-${i}`);
      elements.push(<p key={key} className="font-bold text-blue-800 text-xs mt-2 mb-0.5">{renderInline(trimmed.slice(4), key)}</p>);
    } else if (trimmed.startsWith('## ')) {
      flushList(`f-${i}`);
      elements.push(<p key={key} className="font-bold text-blue-900 text-sm mt-3 mb-1 border-b border-blue-100 pb-0.5">{renderInline(trimmed.slice(3), key)}</p>);
    } else if (trimmed.startsWith('# ')) {
      flushList(`f-${i}`);
      elements.push(<p key={key} className="font-bold text-blue-900 text-sm mt-3 mb-1">{renderInline(trimmed.slice(2), key)}</p>);
    } else if (trimmed.startsWith('- ') || trimmed.startsWith('• ')) {
      if (listItems.length > 0 && isOrdered) flushList(`f-${i}`);
      isOrdered = false;
      listItems.push(trimmed.slice(2));
    } else if (/^\d+\./.test(trimmed)) {
      const match = trimmed.match(/^(\d+)\.\s+(.*)/);
      if (match) {
        if (listItems.length === 0) orderedStart = parseInt(match[1]);
        if (listItems.length > 0 && !isOrdered) flushList(`f-${i}`);
        isOrdered = true;
        listItems.push(match[2]);
      }
    } else if (trimmed === '' || trimmed === '---') {
      flushList(`f-${i}`);
      if (trimmed === '---') elements.push(<hr key={key} className="border-slate-200 my-1" />);
    } else {
      flushList(`f-${i}`);
      elements.push(
        <p key={key} className="text-xs text-slate-700 leading-relaxed">{renderInline(trimmed, key)}</p>
      );
    }
  });
  flushList('final');
  return <div className="space-y-0.5">{elements}</div>;
};

// ─── SAP Joule Chat Widget ─────────────────────────────────────────────────────
interface Message { role: 'user' | 'assistant'; content: string; }

const WELCOME_MESSAGE = `👋 Hi! I'm **SAP Joule**, your AI copilot for SAP MM on this website.

I can help you with:
- **T-codes** & transaction flows
- **Procurement** processes (P2P, STO, Subcontracting)
- **Master data** (Material, Vendor, Info Records)
- **Movement types**, Physical Inventory & Configuration

What would you like to learn today?`;

const SUGGESTED_PROMPTS = [
  'What is the Procure-to-Pay process?',
  'Explain movement type 101',
  'Difference between Contract and SA?',
  'How does MIRO work?',
];

const AIAssistant = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: WELCOME_MESSAGE },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  useEffect(() => {
    if (isOpen && !isMinimized) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, isMinimized]);

  const callJoule = async (history: Message[]) => {
    // Try backend server first (OpenAI via server/index.ts)
    try {
      const res = await fetch('http://localhost:3001/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history }),
      });
      if (res.ok) {
        const data = await res.json();
        return data.answer as string;
      }
    } catch {
      // Server not running — fall back to Gemini client-side
    }

    // Fallback: Gemini via VITE env key (client-side)
    const geminiKey = import.meta.env.VITE_GEMINI_API_KEY ?? '';
    if (!geminiKey || geminiKey === 'your_api_key_here') {
      return '⚠️ **SAP Joule is not yet connected.**\n\nTo activate:\n1. Add `VITE_GEMINI_API_KEY` to your `.env` file, **or**\n2. Start the backend with `npm run server` and add `OPENAI_API_KEY` to `.env`.';
    }

    // Build Gemini contents from history
    const geminiContents = history.map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    const SAP_JOULE_GEMINI_PROMPT = `You are SAP Joule, an expert AI assistant integrated into the SAP MM Learning website. You behave like a professional SAP trainer, SAP MM consultant, and intelligent copilot.

Your purpose is to:
1. Answer SAP MM questions clearly and accurately.
2. Explain concepts from beginner to advanced level.
3. Provide T-codes, process flows, movement types, and best practices.
4. Support business-oriented and real-world SAP MM scenarios.

Topics you cover: Org Structure, Master Data (Material Master, Vendor Master, Info Records, Source List), Purchasing (PR, RFQ, PO, Outline Agreements), Inventory Management (GR, GI, Transfer Postings, Movement Types), Physical Inventory, Valuation, Invoice Verification (MIRO), Integration with FI/SD/PP/QM/WM/CO, SAP S/4HANA vs ECC differences, and MM Configuration.

Rules:
- Respond in professional, clear Markdown.
- Use **bold** for T-codes and key terms, numbered lists for process steps, bullet points for features.
- Be concise first, expand if needed.
- Never fabricate SAP transaction outcomes or document numbers.
- If something varies by company config, say so.
- You do NOT have access to an SAP backend — you are a learning assistant.`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: geminiContents,
          systemInstruction: { parts: [{ text: SAP_JOULE_GEMINI_PROMPT }] },
          generationConfig: { temperature: 0.4, maxOutputTokens: 1024 },
        }),
      }
    );

    if (!response.ok) throw new Error(`Gemini API error ${response.status}`);
    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text ?? "I'm sorry, I couldn't process that.";
  };

  const handleSend = async (text?: string) => {
    const query = (text ?? input).trim();
    if (!query || isLoading) return;

    const userMessage: Message = { role: 'user', content: query };
    const updatedHistory = [...messages, userMessage];

    setMessages(updatedHistory);
    setInput('');
    setShowSuggestions(false);
    setIsLoading(true);

    try {
      const answer = await callJoule(updatedHistory);
      setMessages((prev) => [...prev, { role: 'assistant', content: answer }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: "⚠️ Sorry, I'm having trouble connecting. Please check your API key and try again." },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setMessages([{ role: 'assistant', content: WELCOME_MESSAGE }]);
    setShowSuggestions(true);
    setInput('');
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {isOpen && (
        <div
          className="bg-white shadow-2xl rounded-2xl border border-slate-200 flex flex-col overflow-hidden animate-slideUp"
          style={{ width: '24rem', height: isMinimized ? 'auto' : '540px' }}
        >
          {/* ── Header ── */}
          <div className="bg-gradient-to-r from-blue-900 to-blue-700 p-3 text-white flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2">
              <div className="bg-blue-500/40 p-1.5 rounded-lg">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div>
                <div className="font-bold text-sm leading-none">SAP Joule</div>
                <div className="text-[10px] text-blue-200 leading-none mt-0.5">SAP MM AI Copilot</div>
              </div>
              <div className="ml-1 w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" title="Online" />
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={handleClear}
                title="Clear chat"
                className="hover:bg-blue-600 p-1.5 rounded-lg transition-colors text-blue-200 hover:text-white"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                title={isMinimized ? 'Expand' : 'Minimize'}
                className="hover:bg-blue-600 p-1.5 rounded-lg transition-colors text-blue-200 hover:text-white"
              >
                <MoveRight className={`w-3.5 h-3.5 transition-transform ${isMinimized ? 'rotate-90' : '-rotate-90'}`} />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="hover:bg-blue-600 p-1.5 rounded-lg transition-colors text-blue-200 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* ── Messages ── */}
              <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50 custom-scrollbar">
                {messages.map((msg, idx) => (
                  <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} gap-2`}>
                    {msg.role === 'assistant' && (
                      <div className="w-6 h-6 rounded-full bg-blue-900 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Sparkles className="w-3 h-3 text-white" />
                      </div>
                    )}
                    <div
                      className={`max-w-[82%] px-3 py-2.5 rounded-2xl text-sm ${
                        msg.role === 'user'
                          ? 'bg-blue-600 text-white rounded-tr-sm shadow-sm'
                          : 'bg-white border border-slate-200 text-slate-700 shadow-sm rounded-tl-sm'
                      }`}
                    >
                      {msg.role === 'user' ? (
                        <span className="text-xs">{msg.content}</span>
                      ) : (
                        renderChatMarkdown(msg.content)
                      )}
                    </div>
                  </div>
                ))}

                {/* Suggested prompts */}
                {showSuggestions && messages.length === 1 && (
                  <div className="space-y-1.5 mt-2">
                    <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider px-1">Suggested Questions</p>
                    {SUGGESTED_PROMPTS.map((p) => (
                      <button
                        key={p}
                        onClick={() => handleSend(p)}
                        className="w-full text-left text-xs bg-white border border-slate-200 hover:border-blue-400 hover:bg-blue-50 text-slate-600 px-3 py-2 rounded-xl transition-all"
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                )}

                {/* Loading indicator */}
                {isLoading && (
                  <div className="flex justify-start gap-2">
                    <div className="w-6 h-6 rounded-full bg-blue-900 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Sparkles className="w-3 h-3 text-white" />
                    </div>
                    <div className="bg-white border border-slate-200 px-4 py-3 rounded-2xl rounded-tl-sm shadow-sm flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                )}
              </div>

              {/* ── Input ── */}
              <div className="p-3 border-t border-slate-100 bg-white flex-shrink-0">
                <div className="flex gap-2 items-center">
                  <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                    placeholder="Ask SAP Joule anything..."
                    className="flex-1 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50"
                    disabled={isLoading}
                  />
                  <button
                    onClick={() => handleSend()}
                    disabled={isLoading || !input.trim()}
                    className="bg-blue-700 text-white p-2 rounded-xl hover:bg-blue-800 disabled:opacity-40 transition-colors flex-shrink-0"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p className="text-[9px] text-slate-400 text-center mt-1.5">SAP Joule · Powered by Antigravity AI</p>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── FAB Button ── */}
      <button
        onClick={() => { setIsOpen(!isOpen); setIsMinimized(false); }}
        className={`relative text-white p-4 rounded-full shadow-xl transition-all duration-300 flex items-center justify-center group ${
          isOpen ? 'bg-slate-700 hover:bg-slate-800 rotate-0' : 'bg-blue-900 hover:bg-blue-800 hover:scale-110'
        }`}
        title="SAP Joule – AI Copilot"
      >
        {isOpen ? <X className="w-5 h-5" /> : <Sparkles className="w-5 h-5" />}
        {!isOpen && (
          <span className="absolute -top-1 -right-1 bg-green-400 text-[8px] font-bold text-white px-1 rounded-full leading-4 shadow">
            AI
          </span>
        )}
      </button>
    </div>
  );
};

const IntroSection = () => (
  <div className="space-y-6 animate-fadeIn">
    <div className="bg-gradient-to-r from-blue-900 to-blue-700 text-white p-8 rounded-2xl shadow-lg">
      <h2 className="text-3xl font-bold mb-4">Systems, Applications, and Products</h2>
      <p className="text-blue-100 text-lg">
        The world's leading ERP system. It helps companies manage and integrate all their business processes in one
        centralized platform.
      </p>
    </div>
    <div className="grid md:grid-cols-2 gap-6">
      <div className="bg-white p-6 rounded-xl shadow border border-slate-200">
        <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
          <Settings className="text-blue-600" /> Core Benefits
        </h3>
        <ul className="space-y-3">
          {[
            { title: 'Centralized Data', desc: 'All data stored in one system.' },
            { title: 'Efficiency', desc: 'Automation reduces manual work.' },
            { title: 'Real-Time Reporting', desc: 'Live data for faster decisions.' },
            { title: 'Scalability', desc: 'Grows from small business to global enterprise.' },
          ].map((item, idx) => (
            <li key={idx} className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-500 mt-1 flex-shrink-0" />
              <div>
                <span className="font-semibold text-slate-700">{item.title}:</span>{' '}
                <span className="text-slate-600">{item.desc}</span>
              </div>
            </li>
          ))}
        </ul>
      </div>
      <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
        <h3 className="text-xl font-bold text-slate-800 mb-4">Global Impact</h3>
        <div className="grid grid-cols-2 gap-4 text-center">
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="text-2xl font-bold text-blue-600">400k+</div>
            <div className="text-xs text-slate-500 uppercase font-semibold">Companies</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="text-2xl font-bold text-blue-600">180+</div>
            <div className="text-xs text-slate-500 uppercase font-semibold">Countries</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm col-span-2">
            <div className="text-2xl font-bold text-blue-600">80%</div>
            <div className="text-xs text-slate-500 uppercase font-semibold">Of World's Largest Companies</div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const ModulesSection = () => {
  const [activeTab, setActiveTab] = useState('functional');
  return (
    <div className="space-y-6">
      <div className="flex gap-4 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('functional')}
          className={`pb-2 px-4 font-semibold transition-colors ${activeTab === 'functional' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500'}`}
        >
          Functional Modules
        </button>
        <button
          onClick={() => setActiveTab('technical')}
          className={`pb-2 px-4 font-semibold transition-colors ${activeTab === 'technical' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500'}`}
        >
          Technical Modules
        </button>
      </div>
      {activeTab === 'functional' ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { code: 'MM', name: 'Materials Management', desc: 'Procurement, inventory, material master.' },
            { code: 'SD', name: 'Sales & Distribution', desc: 'Orders, delivery, billing.' },
            { code: 'PP', name: 'Production Planning', desc: 'Manufacturing control.' },
            { code: 'FI', name: 'Financial Accounting', desc: 'Financial reporting & records.' },
            { code: 'CO', name: 'Controlling', desc: 'Internal cost & profitability.' },
            { code: 'QM', name: 'Quality Management', desc: 'Inspections & defects.' },
            { code: 'PM', name: 'Plant Maintenance', desc: 'Equipment lifecycle.' },
            { code: 'WM', name: 'Warehouse Management', desc: 'Storage bin management.' },
          ].map((mod) => (
            <div
              key={mod.code}
              className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow"
            >
              <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold mb-3">
                {mod.code}
              </div>
              <h4 className="font-bold text-slate-800">{mod.name}</h4>
              <p className="text-sm text-slate-500 mt-1">{mod.desc}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
          <h3 className="font-bold text-lg mb-4">Back-end Operations</h3>
          <ul className="space-y-4">
            <li className="flex items-start gap-3">
              <div className="font-mono bg-slate-200 px-2 py-1 rounded text-sm font-bold">BASIS</div>
              <p className="text-slate-600">Install & update the application (System Administration).</p>
            </li>
            <li className="flex items-start gap-3">
              <div className="font-mono bg-slate-200 px-2 py-1 rounded text-sm font-bold">ABAP</div>
              <p className="text-slate-600">Advanced Business Application Programming (Coding).</p>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
};

const PURCHASING_ORG_MODELS = [
  {
    id: 'centralized',
    title: 'Centralized (Cross-company)',
    heading: 'Centralized Purchasing Organization (Corporate-Group-Wide / Cross-Company-Code)',
    definition:
      'A single purchasing organization handles procurement across multiple company codes and multiple plants. It is not assigned to a specific company code in the system configuration, so it can buy for plants belonging to different legal entities.',
    advantages: [
      'Volume Discounts: Pooling demand across the corporate group maximizes bargaining power.',
      'Efficiency: Standardized vendor management, fewer duplicate contracts, and centralized reporting.',
      'Consistency: Unified terms, conditions, and pricing agreements.',
    ],
    configuration: [
      'Define the purchasing organization via Enterprise Structure → Definition → Materials Management → Maintain Purchasing Organization.',
      'Do not assign this purchasing organization to any company code.',
      'Assign the purchasing organization to multiple plants across different company codes via Enterprise Structure → Assignment → Materials Management → Assign Purchasing Organization to Plant.',
    ],
  },
  {
    id: 'company-specific',
    title: 'Company-Specific',
    heading: 'Company-Specific Purchasing Organization (Cross-Plant)',
    definition:
      'A purchasing organization is responsible for procurement activities for one specific company code and can buy for all or multiple plants belonging to that company code.',
    advantages: [
      'Legal & Financial Alignment: Keeps purchasing activities within one financial and legal accounting unit.',
      'Localized Bargaining: Balances group-level scale with regional or company-specific supplier requirements.',
      'Simplified Audits: P&L and balance sheet impacts are aligned with a single company code.',
    ],
    configuration: [
      'Define the purchasing organization via Enterprise Structure → Definition → Materials Management → Maintain Purchasing Organization.',
      'Assign the purchasing organization to a single company code via Enterprise Structure → Assignment → Materials Management → Assign Purchasing Organization to Company Code.',
      'Assign it to multiple plants that all belong to that same company code via Enterprise Structure → Assignment → Materials Management → Assign Purchasing Organization to Plant.',
    ],
  },
  {
    id: 'plant-specific',
    title: 'Plant-Specific (Decentralized)',
    heading: 'Plant-Specific Purchasing Organization (Decentralized)',
    definition:
      'A purchasing organization is dedicated to a single plant, or a tightly restricted scope. It is assigned to a company code and linked to just one specific plant.',
    advantages: [
      'High Agility: Local buyers understand immediate plant requirements and emergency stock needs.',
      'Flexibility: Local vendor relationships and fast turnaround for operational requisitions.',
      'Clear Accountability: Procurement spend and delivery performance are tied directly to one plant.',
    ],
    configuration: [
      'Define the purchasing organization via Enterprise Structure → Definition → Materials Management → Maintain Purchasing Organization.',
      'Assign it to the relevant company code via Enterprise Structure → Assignment → Materials Management → Assign Purchasing Organization to Company Code.',
      'Assign it to only one specific plant via Enterprise Structure → Assignment → Materials Management → Assign Purchasing Organization to Plant.',
    ],
  },
];

const OrgStructureSection = () => {
  const [expandedModels, setExpandedModels] = useState<string[]>([]);

  const toggleModel = (id: string) => {
    setExpandedModels((expanded) =>
      expanded.includes(id) ? expanded.filter((modelId) => modelId !== id) : [...expanded, id]
    );
  };

  return (
  <div className="space-y-8">
    <div className="text-center max-w-2xl mx-auto">
      <h3 className="text-xl font-bold text-slate-800 mb-2">Hierarchy Visualizer</h3>
      <p className="text-slate-500">How procurement and inventory are managed within an organization.</p>
    </div>
    <div className="flex flex-col items-center">
      <div className="w-64 bg-slate-800 text-white p-3 rounded-lg text-center shadow-lg mb-4 relative z-10">
        <div className="font-bold">Client (000)</div>
        <div className="text-xs text-slate-300">Highest Level</div>
        <div className="absolute bottom-0 left-1/2 w-0.5 h-4 bg-slate-300 translate-y-full -translate-x-1/2"></div>
      </div>
      <div className="w-64 bg-blue-700 text-white p-3 rounded-lg text-center shadow-lg mb-4 mt-4 relative z-10">
        <div className="font-bold">Company Code (1000)</div>
        <div className="text-xs text-blue-200">Legal Entity / Financials</div>
        <div className="absolute bottom-0 left-1/2 w-0.5 h-4 bg-slate-300 translate-y-full -translate-x-1/2"></div>
      </div>
      <div className="w-64 bg-blue-600 text-white p-3 rounded-lg text-center shadow-lg mb-4 mt-4 relative z-10">
        <div className="font-bold">Plant (1000)</div>
        <div className="text-xs text-blue-100">Physical/Logical Location</div>
        <div className="absolute bottom-0 left-1/2 w-0.5 h-4 bg-slate-300 translate-y-full -translate-x-1/2"></div>
      </div>
      <div className="w-64 bg-blue-500 text-white p-3 rounded-lg text-center shadow-lg mt-4">
        <div className="font-bold">Storage Location (0001)</div>
        <div className="text-xs text-blue-100">Inventory Management</div>
      </div>
    </div>
    <div className="grid md:grid-cols-2 gap-6 mt-8">
      <div className="bg-orange-50 p-5 rounded-xl border border-orange-100">
        <h4 className="font-bold text-orange-800 mb-2">Purchasing Organization</h4>
        <p className="text-sm text-slate-700 mb-2">Responsible for procuring materials and negotiating conditions.</p>
        <div className="space-y-2">
          {PURCHASING_ORG_MODELS.map((model) => {
            const isExpanded = expandedModels.includes(model.id);
            const panelId = `purchasing-org-${model.id}-details`;

            return (
              <div key={model.id} className="overflow-hidden rounded-lg border border-orange-200 bg-white">
                <button
                  type="button"
                  aria-expanded={isExpanded}
                  aria-controls={panelId}
                  onClick={() => toggleModel(model.id)}
                  className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm font-semibold text-orange-900 transition-colors hover:bg-orange-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-orange-600"
                >
                  <span>{model.title}</span>
                  <ChevronDown
                    aria-hidden="true"
                    size={18}
                    className={`shrink-0 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                  />
                </button>
                <div
                  id={panelId}
                  hidden={!isExpanded}
                  className="space-y-4 border-t border-orange-100 px-4 py-4"
                >
                  <h5 className="font-bold text-slate-800">{model.heading}</h5>
                  <section>
                    <h6 className="mb-1 text-sm font-semibold text-slate-800">Definition</h6>
                    <p className="text-sm leading-relaxed text-slate-600">{model.definition}</p>
                  </section>
                  <section>
                    <h6 className="mb-1 text-sm font-semibold text-slate-800">Advantages</h6>
                    <ul className="list-disc space-y-1 pl-5 text-sm leading-relaxed text-slate-600">
                      {model.advantages.map((advantage) => (
                        <li key={advantage}>{advantage}</li>
                      ))}
                    </ul>
                  </section>
                  <section>
                    <h6 className="mb-1 text-sm font-semibold text-slate-800">Configuration (SAP SPRO)</h6>
                    <ol className="list-decimal space-y-1 pl-5 text-sm leading-relaxed text-slate-600">
                      {model.configuration.map((step) => (
                        <li key={step}>{step}</li>
                      ))}
                    </ol>
                  </section>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <div className="bg-green-50 p-5 rounded-xl border border-green-100">
        <h4 className="font-bold text-green-800 mb-2">Purchasing Group</h4>
        <p className="text-sm text-slate-700">
          A buyer or group of buyers responsible for day-to-day operational purchasing activities.
        </p>
      </div>
    </div>
  </div>
  );
};

interface P2PDetailItem {
  label?: string;
  text: string;
}

interface P2PDetailSection {
  title: string;
  description?: string;
  items?: P2PDetailItem[];
  ordered?: boolean;
}

const P2P_STEP_DETAILS: Record<string, P2PDetailSection[]> = {
  Sourcing: [
    {
      title: 'Definitions',
      items: [
        {
          label: 'Request for Quotation (RFQ):',
          text: 'An official purchasing document sent to one or more vendors to request pricing, delivery times, payment terms, and conditions for specific materials or services.',
        },
        {
          label: 'Vendor Selection:',
          text: 'The evaluation of vendor quotations, comparing proposals against requirements to select a suitable supplier.',
        },
      ],
    },
    {
      title: 'Key Features',
      items: [
        { label: 'Collective management:', text: 'A collective number groups related RFQs sent to multiple vendors for the same requirement.' },
        { label: 'Deadline tracking:', text: 'The quotation deadline helps control when vendor responses must be received.' },
        { label: 'Quotation evaluation:', text: 'Vendor proposals can be compared on price and other configured criteria, such as quality, delivery, and vendor history.' },
        { label: 'System integration:', text: 'The selected quotation can be used as a source when creating a purchase order or, where configured, an outline agreement.' },
      ],
    },
    {
      title: 'Transaction Codes',
      items: [
        { label: 'ME41', text: 'Create RFQ' },
        { label: 'ME42', text: 'Change RFQ' },
        { label: 'ME43', text: 'Display RFQ' },
        { label: 'ME9A', text: 'Output / send RFQ' },
        { label: 'ME47', text: 'Maintain vendor quotation' },
        { label: 'ME49', text: 'Compare vendor quotations' },
        { label: 'ME21N', text: 'Create purchase order' },
      ],
    },
    {
      title: 'RFQ Document Types',
      description: 'Document types and their keys can vary by SAP release and system configuration. Confirm the keys used in your SAP system.',
      items: [
        { label: 'AN (Standard RFQ):', text: 'For regular material procurement.' },
        { label: 'LB (Subcontracting RFQ):', text: 'For procurement involving vendor processing of materials supplied by your company.' },
        { label: 'DL (Service RFQ):', text: 'For service procurement.' },
        { label: 'KA (Consignment RFQ):', text: 'For requesting terms for vendor-owned stock held at your location.' },
      ],
    },
    {
      title: 'SAP Process Flow',
      ordered: true,
      items: [
        { label: 'Requirement / source identification:', text: 'A PR is created, or procurement initiates a sourcing event.' },
        { label: 'RFQ generation (ME41):', text: 'The buyer enters items, quantities, and a collective number, then creates vendor-specific RFQs.' },
        { label: 'Send RFQ (ME9A):', text: 'The document is sent using the configured output method, such as email, EDI, or print.' },
        { label: 'Maintain quotations (ME47):', text: 'Record vendor prices, discounts, delivery dates, and other terms.' },
        { label: 'Compare quotations (ME49):', text: 'Evaluate vendor responses side by side using the available pricing conditions.' },
        { label: 'Award / reject:', text: 'Select the winning quotation, handle rejected bids, and use the selected source to create a PO (ME21N).' },
      ],
    },
    {
      title: 'S/4HANA Note',
      description: 'SAP S/4HANA also provides Fiori apps for managing requests for quotations and comparing supplier quotations; availability depends on the system configuration.',
    },
  ],
  Order: [
    {
      title: 'Definition',
      description: 'A Purchase Order (PO) is a formal instruction sent by a purchasing organization to a vendor or an internal plant to supply goods or services under agreed terms, prices, and quantities. A PO may create a contractual commitment according to the applicable terms and policies.',
    },
    {
      title: 'Key Features',
      items: [
        { label: 'Three-level structure:', text: 'Header information (such as vendor, company code, currency, and payment terms), item overview, and item details (such as material, delivery dates, and account assignments).' },
        { label: 'Integration:', text: 'Connects with Materials Management (MM), Financial Accounting (FI), Sales and Distribution (SD), and warehouse processes.' },
        { label: 'Source determination:', text: 'Can be created manually or with reference to a PR, quotation, or contract.' },
        { label: 'Release / approval strategy:', text: 'Supports configured approval workflows based on factors such as value or document type.' },
        { label: 'Three-way matching:', text: 'Supports checking the PO against goods receipts and supplier invoices.' },
      ],
    },
    {
      title: 'Transaction Codes',
      items: [
        { label: 'ME21N', text: 'Create purchase order' },
        { label: 'ME22N', text: 'Change purchase order' },
        { label: 'ME23N', text: 'Display purchase order' },
        { label: 'ME29N', text: 'Release / approve purchase order (where configured)' },
        { label: 'ME2L', text: 'Purchase orders by vendor' },
        { label: 'ME2M', text: 'Purchase orders by material' },
        { label: 'ME2N', text: 'Purchase order list by document number' },
        { label: 'ME9F', text: 'Purchase order output' },
      ],
    },
    {
      title: 'Main Types of Purchase Orders',
      items: [
        { label: 'Standard PO (NB):', text: 'One-time procurement of stock or consumable materials from an external vendor.' },
        { label: 'Stock Transport Order (UB):', text: 'Internal procurement to transfer goods between plants; organizational scope and configuration determine the scenario.' },
        { label: 'Subcontracting PO (item category L):', text: 'A vendor processes components supplied by your company and returns the finished product.' },
        { label: 'Consignment PO (item category K):', text: 'Vendor-owned stock is held at your facility; ownership generally transfers upon withdrawal.' },
        { label: 'Service PO:', text: 'Procures services, with service entry and acceptance processes as configured.' },
        { label: 'Framework / blanket PO:', text: 'Supports recurring or low-value purchases within defined validity and value limits; document types and usage vary by configuration.' },
        { label: 'Third-party PO:', text: 'Supports a process where the vendor delivers goods directly to your customer.' },
      ],
    },
    {
      title: 'Procure-to-Pay Flow',
      ordered: true,
      items: [
        { label: 'Requirement and PR:', text: 'A need is identified and recorded in a purchase requisition (ME51N).' },
        { label: 'Source determination:', text: 'Quotations or contracts are evaluated to select a source.' },
        { label: 'PO creation (ME21N):', text: 'The approved requirement is converted into a purchase order.' },
        { label: 'PO approval (ME29N):', text: 'Authorized users release the PO when a configured approval strategy applies.' },
        { label: 'Goods receipt (MIGO):', text: 'The receipt is recorded against the PO.' },
        { label: 'Invoice verification (MIRO):', text: 'The supplier invoice is checked against relevant purchasing and receipt data.' },
        { label: 'Vendor payment:', text: 'Finance processes payment for the cleared liability, for example through F110.' },
      ],
    },
  ],
  Receipt: [
    {
      title: 'Definition',
      description: 'A Goods Receipt (GR) records the physical arrival and acceptance of materials into company inventory. It may be received from an external vendor, another plant, or a production order.',
    },
    {
      title: 'Key Features',
      items: [
        { label: 'Stock update:', text: 'Updates quantities at the plant and storage location, including the relevant stock category.' },
        { label: 'Material document:', text: 'Creates a material document as a record of the goods movement.' },
        { label: 'Accounting integration:', text: 'For valuated materials, the receipt can create FI postings, such as inventory and GR/IR entries.' },
        { label: 'PO history update:', text: 'Updates purchase order history with the received quantities.' },
        { label: 'Invoice verification:', text: 'Provides receipt information used in subsequent supplier invoice verification.' },
      ],
    },
    {
      title: 'Transaction Codes',
      items: [
        { label: 'MIGO', text: 'Post goods movements, including goods receipts' },
        { label: 'MB01', text: 'Legacy goods receipt transaction; replaced by MIGO in current SAP S/4HANA usage' },
        { label: 'MB03 / MB51', text: 'Display or list material documents, depending on system availability' },
        { label: 'ME23N', text: 'Display a PO and review its purchase order history' },
      ],
    },
    {
      title: 'Common Movement Types',
      items: [
        { label: '101', text: 'Goods receipt for a purchase order' },
        { label: '103', text: 'Goods receipt to GR blocked stock' },
        { label: '105', text: 'Release from GR blocked stock' },
        { label: '107 / 109', text: 'Goods receipt to valuated blocked stock and subsequent transfer, where configured' },
        { label: '131', text: 'Goods receipt from a production order' },
        { label: '122', text: 'Return delivery to vendor' },
      ],
    },
    {
      title: 'Goods Receipt Flow',
      ordered: true,
      items: [
        { label: 'PR:', text: 'An internal department requests goods or services.' },
        { label: 'PO:', text: 'Procurement issues a purchase order to the supplier.' },
        { label: 'Physical arrival:', text: 'The shipment arrives with the delivery documentation.' },
        { label: 'Post GR (MIGO):', text: 'The receiving clerk references the PO, verifies the delivery, and posts the receipt.' },
        { label: 'System updates:', text: 'Inventory, material documents, PO history, and applicable accounting documents are updated.' },
        { label: 'Quality inspection:', text: 'If QM is active, received stock may be placed in inspection stock until accepted.' },
        { label: 'Invoice receipt (MIRO):', text: 'Accounts Payable verifies the invoice using the purchasing and receipt records.' },
      ],
    },
  ],
  Invoice: [
    {
      title: 'Definition',
      description: 'An invoice is a commercial document requesting payment for delivered goods or services. Logistics Invoice Verification (LIV) in SAP MM checks incoming supplier invoices before they proceed for payment.',
    },
    {
      title: 'Key Features',
      items: [
        { label: 'Three-way matching:', text: 'Checks invoice information against the PO and goods receipt for relevant quantities and prices.' },
        { label: 'Tolerance limits:', text: 'Configured tolerances, maintained for example via OMR6, govern how variances are handled.' },
        { label: 'Invoice blocking:', text: 'Invoices with configured blocking conditions can be reviewed and released, for example using MRBR.' },
        { label: 'Document integration:', text: 'Posting creates an invoice document and, where applicable, a corresponding FI accounting document.' },
        { label: 'Invoice reduction:', text: 'SAP supports invoice reduction scenarios for certain discrepancies and configuration; handling depends on the process setup.' },
      ],
    },
    {
      title: 'Types of Invoices',
      items: [
        { label: 'Invoice:', text: 'Standard request for payment, commonly referencing a PO.' },
        { label: 'Credit memo:', text: 'Reduces the amount owed to a supplier, for example after a return.' },
        { label: 'Subsequent debit / credit:', text: 'Adjusts the value of a previously posted invoice without changing the received quantity.' },
        { label: 'Delivery costs:', text: 'Adds costs such as freight, customs, or insurance.' },
        { label: 'Non-PO invoice:', text: 'Posts directly to an account without a purchasing document reference, according to company process.' },
        { label: 'Differential / provisional invoice:', text: 'Used in applicable commodity or contract processes when final pricing is determined later.' },
      ],
    },
    {
      title: 'Transaction Codes',
      items: [
        { label: 'MIRO', text: 'Enter incoming invoice' },
        { label: 'MIR7', text: 'Park invoice' },
        { label: 'MIR4', text: 'Display invoice document' },
        { label: 'MR8M', text: 'Cancel invoice document' },
        { label: 'MRBR', text: 'Release blocked invoices' },
        { label: 'MIR6', text: 'Invoice overview' },
        { label: 'MRRL', text: 'Evaluated Receipt Settlement (ERS), where used' },
        { label: 'OMR6', text: 'Configure invoice tolerance limits' },
      ],
    },
    {
      title: 'Invoice Verification Flow',
      ordered: true,
      items: [
        { label: 'PR:', text: 'An internal request is raised (ME51N).' },
        { label: 'PO:', text: 'A purchase order is sent to the supplier (ME21N).' },
        { label: 'Goods receipt:', text: 'The delivery is recorded (MIGO), updating relevant receipt and GR/IR data.' },
        { label: 'Invoice receipt:', text: 'The supplier invoice is entered and verified (MIRO).' },
        { label: 'Three-way match:', text: 'SAP checks quantities and prices across the PO, GR, and invoice.' },
        { label: 'FI posting:', text: 'Posting records the payable and corresponding account entries.' },
        { label: 'Payment:', text: 'Finance settles the payable through the configured payment process (for example, F110).' },
      ],
    },
  ],
  Payment: [
    {
      title: 'Definition',
      description: 'A vendor payment (outgoing payment) in SAP FI-AP settles funds owed to a supplier. Posting the payment clears the selected vendor open items and creates the corresponding general ledger entries.',
    },
    {
      title: 'Key Features',
      items: [
        { label: 'Open item clearing:', text: 'Matches outgoing payments to open vendor invoices and clears the selected items.' },
        { label: 'Cash discount management:', text: 'Applies eligible early-payment discounts according to payment terms and configuration.' },
        { label: 'Payment blocks and approvals:', text: 'Supports configured holds and approval controls to prevent premature payment.' },
        { label: 'Currency handling:', text: 'Records applicable realized exchange-rate differences when payment currency differs.' },
        { label: 'Payment medium generation:', text: 'Can create bank files, checks, or other electronic payment media based on configuration.' },
        { label: 'Audit and integration:', text: 'Connects vendor payments to FI and the procurement document trail, including PO, GR, and invoice verification.' },
      ],
    },
    {
      title: 'Types of Vendor Payments',
      items: [
        { label: 'Manual outgoing payment (F-53):', text: 'Posts an individual payment and clears selected open items.' },
        { label: 'Payment with check printing (F-58):', text: 'Posts an outgoing payment and supports check output.' },
        { label: 'Automatic Payment Program (F110):', text: 'Selects due items and processes scheduled or mass payments.' },
        { label: 'Down payment (F-48):', text: 'Posts a vendor down payment or advance according to the configured process.' },
        { label: 'Partial / residual payment:', text: 'Pays part of an amount or clears an invoice while carrying forward a remaining balance, depending on the selected method.' },
      ],
    },
    {
      title: 'Transaction Codes',
      items: [
        { label: 'F-53', text: 'Post manual outgoing payment' },
        { label: 'F-58', text: 'Post outgoing payment with check printing' },
        { label: 'F110', text: 'Run the Automatic Payment Program' },
        { label: 'FBZP', text: 'Configure Automatic Payment Program settings' },
        { label: 'F-48', text: 'Post vendor down payment' },
        { label: 'F-44', text: 'Clear vendor open items manually' },
        { label: 'FBL1N', text: 'Display vendor line items' },
        { label: 'FB60', text: 'Enter vendor invoice in FI' },
        { label: 'MIRO', text: 'Enter logistics invoice' },
      ],
    },
    {
      title: 'Manual Payment Flow (F-53)',
      ordered: true,
      items: [
        { label: 'Enter payment header:', text: 'Provide document and posting dates, company code, currency, and other required details.' },
        { label: 'Enter bank details:', text: 'Select the appropriate bank account and enter payment amount and reference.' },
        { label: 'Select open items:', text: 'Choose the vendor and the invoices to clear.' },
        { label: 'Simulate and post:', text: 'Review the accounting entries, then post the payment to clear the selected items.' },
      ],
    },
    {
      title: 'Automatic Payment Flow (F110)',
      ordered: true,
      items: [
        { label: 'Maintain parameters:', text: 'Specify run date, identification, company codes, payment methods, posting date, and selection criteria.' },
        { label: 'Create proposal:', text: 'SAP selects eligible open invoices and calculates due dates and applicable discounts.' },
        { label: 'Review proposal:', text: 'Review blocked or disputed items and make permitted adjustments.' },
        { label: 'Execute payment run:', text: 'Post payments and clear eligible vendor open items.' },
        { label: 'Generate payment medium:', text: 'Create the configured bank file or check output.' },
        { label: 'Verify clearing:', text: 'Review the vendor account, for example in FBL1N, to confirm item status.' },
      ],
    },
  ],
};

const SPECIAL_PROCUREMENT_DETAILS: Record<string, P2PDetailSection[]> = {
  sto: [
    {
      title: 'Definition',
      description: 'A Stock Transport Order (STO) is a special purchase order used to manage and track material transfers from a supplying plant to a receiving plant, within one company code or across company codes.',
    },
    {
      title: 'Key Features',
      items: [
        { label: 'Internal procurement:', text: 'The supplying plant acts as the source instead of an external vendor.' },
        { label: 'Stock in transit:', text: 'The two-step process can track goods while they move between plants.' },
        { label: 'MRP integration:', text: 'Plant requirements and replenishment can be included in Material Requirements Planning.' },
        { label: 'Logistics and financial control:', text: 'Depending on the process, an STO can use deliveries, picking, goods issue, freight, and intercompany billing or invoice verification.' },
        { label: 'Approval workflow:', text: 'Release strategies can be applied when configured for the purchasing document.' },
      ],
    },
    {
      title: 'STO Types',
      items: [
        { label: 'Intra-company:', text: 'Transfer between plants belonging to the same company code. UB is commonly used; the exact document type depends on configuration.' },
        { label: 'Intercompany:', text: 'Transfer between plants in different company codes. This can involve intercompany billing and invoice processing; document type and configuration can vary.' },
        { label: 'With delivery:', text: 'Uses delivery processing for shipping, picking, and post goods issue.' },
        { label: 'Without delivery:', text: 'Posts the stock transfer directly through Inventory Management, without an SD delivery.' },
      ],
    },
    {
      title: 'Intra-Company STO Flow (Delivery-Based Example)',
      ordered: true,
      items: [
        { label: 'Create STO:', text: 'The receiving plant creates the order, commonly using document type UB.' },
        { label: 'Release STO:', text: 'Obtain approval if a release strategy is configured.' },
        { label: 'Create outbound delivery:', text: 'Create a delivery for the supplying plant; NL is a commonly used delivery type.' },
        { label: 'Pick and post goods issue:', text: 'Complete picking and post the goods issue. Movement type 641 is commonly used for a two-step process and moves stock into transit.' },
        { label: 'Post goods receipt:', text: 'The receiving plant posts the receipt, commonly with movement type 101.' },
        { label: 'One-step alternative:', text: 'Depending on configuration, movement types such as 647 or 301 may be used for one-step transfer scenarios.' },
      ],
    },
    {
      title: 'Intercompany STO Flow',
      ordered: true,
      items: [
        { label: 'Create STO:', text: 'Create the order for the receiving plant and maintain required intercompany vendor/customer assignments.' },
        { label: 'Create outbound delivery:', text: 'Create a delivery; NLCC is commonly used in intercompany delivery scenarios.' },
        { label: 'Post goods issue:', text: 'Post the supplying plant goods issue; movement type 643 is commonly used.' },
        { label: 'Post goods receipt:', text: 'The receiving plant posts the goods receipt, commonly with movement type 101.' },
        { label: 'Intercompany billing:', text: 'Create the intercompany billing document when required by the configured process.' },
        { label: 'Invoice verification:', text: 'The receiving company processes the supplier invoice where applicable.' },
      ],
    },
    {
      title: 'Transaction Codes',
      items: [
        { label: 'ME21N / ME22N / ME23N', text: 'Create, change, and display purchase orders / STOs' },
        { label: 'ME28 / ME29N', text: 'Release purchase orders where configured' },
        { label: 'VL10B / VL10D / VL01N', text: 'Create deliveries, depending on scenario and system setup' },
        { label: 'VL02N / MIGO', text: 'Process delivery or goods movements' },
        { label: 'VL09', text: 'Reverse goods issue for delivery' },
        { label: 'VF01', text: 'Create intercompany billing document' },
        { label: 'MIRO', text: 'Supplier invoice verification' },
      ],
    },
  ],
  subcontracting: [
    {
      title: 'Definition',
      description: 'Subcontracting (purchase order item category L) is a procurement process where you provide components to an external vendor, who processes or assembles them into a finished or semi-finished product and returns it. The vendor typically charges for the processing service; component ownership and valuation depend on the configured process.',
    },
    {
      title: 'Key Features',
      items: [
        { label: 'Item category L:', text: 'Identifies a subcontracting item on the purchase order.' },
        { label: 'Component planning:', text: 'A BOM can be used to determine required components for the finished product, subject to master data and configuration.' },
        { label: 'Stock provided to vendor:', text: 'Components at the subcontractor are tracked separately as special stock O.' },
        { label: 'Component transfer:', text: 'Transfer to the vendor changes stock status; accounting effects depend on valuation and configuration.' },
        { label: 'Component consumption:', text: 'At receipt of the finished material, component consumption can be posted as part of the subcontracting receipt.' },
      ],
    },
    {
      title: 'Types of Subcontracting',
      items: [
        { label: 'Standard:', text: 'Your plant sends components to one subcontractor, who returns the processed product.' },
        { label: 'Multi-level:', text: 'Components are processed through multiple subcontractors or BOM levels.' },
        { label: 'Assembly vs. operation:', text: 'The subcontractor may assemble a product or perform a particular operation; the specific SAP process depends on the business scenario.' },
        { label: 'Direct component delivery:', text: 'A component supplier can deliver materials directly to the subcontractor where the process supports it.' },
      ],
    },
    {
      title: 'Subcontracting Process Flow',
      ordered: true,
      items: [
        { label: 'Prepare master data:', text: 'Maintain the material, BOM (for example, CS01), purchasing info record where needed, and supplier/business partner data.' },
        { label: 'Create subcontracting PO:', text: 'Create the purchase order in ME21N with item category L and verify the components.' },
        { label: 'Transfer components:', text: 'Post the component transfer to vendor stock using movement type 541, for example in MIGO; ME2O can support monitoring.' },
        { label: 'Receive finished goods:', text: 'Post the finished product goods receipt using movement type 101. Component consumption, commonly movement type 543, is posted according to the process.' },
        { label: 'Return unused components:', text: 'If needed, post a return from vendor stock, commonly movement type 542.' },
        { label: 'Verify supplier invoice:', text: 'Process the subcontractor service charge using MIRO.' },
      ],
    },
    {
      title: 'Transaction Codes',
      items: [
        { label: 'ME21N / ME22N', text: 'Create or change subcontracting purchase order' },
        { label: 'ME51N', text: 'Create purchase requisition' },
        { label: 'ME11', text: 'Create purchasing info record' },
        { label: 'CS01', text: 'Create BOM' },
        { label: 'MIGO (541 / 101 / 543 / 542)', text: 'Post component transfer, finished goods receipt, consumption, and return movements' },
        { label: 'ME2O / MB58', text: 'Monitor subcontracting stock and components with vendor, where available' },
        { label: 'MIRO', text: 'Logistics invoice verification' },
        { label: 'MMBE', text: 'Display stock overview' },
      ],
    },
  ],
  consignment: [
    {
      title: 'Definition',
      description: 'Vendor consignment (purchase order item category K) is a process where a supplier stores goods at your premises while ownership remains with the vendor until you withdraw or transfer the stock. Settlement is generally based on the quantities consumed or transferred to your own stock.',
    },
    {
      title: 'Key Features',
      items: [
        { label: 'No liability at receipt:', text: 'A consignment goods receipt generally does not create a vendor liability or FI accounting document.' },
        { label: 'Special stock K:', text: 'Consignment inventory is tracked separately from company-owned stock.' },
        { label: 'Consignment info record:', text: 'Vendor-specific consignment pricing and conditions are maintained in an info record and used in applicable consumption and settlement processes.' },
        { label: 'Stock categories:', text: 'Consignment quantities can be managed in relevant stock categories, subject to configuration.' },
        { label: 'Settlement:', text: 'A liability is recognized when stock is withdrawn or transferred to own stock and settled according to the configured process.' },
      ],
    },
    {
      title: 'Consignment Scenarios',
      items: [
        { label: 'Vendor consignment (MM, item category K):', text: 'Vendor-owned goods are stored at your plant; settlement follows consumption or transfer to own stock.' },
        { label: 'Customer consignment (SD):', text: 'Your company places company-owned goods at a customer site; this is a distinct Sales and Distribution process.' },
      ],
    },
    {
      title: 'Vendor Consignment Process Flow',
      ordered: true,
      items: [
        { label: 'Create consignment info record:', text: 'Maintain the vendor, material, and agreed consignment conditions.' },
        { label: 'Create consignment PO:', text: 'Create the purchase order with item category K; pricing is generally determined from consignment conditions rather than entered as a standard PO price.' },
        { label: 'Post goods receipt:', text: 'Receive goods into vendor consignment stock, commonly using movement type 101 K; no vendor liability is normally posted at this step.' },
        { label: 'Consume or transfer stock:', text: 'Withdraw for a cost center (201 K), production order (261 K), or transfer to own stock (411 K), as applicable.' },
        { label: 'Settle consignment:', text: 'Run the configured settlement process to recognize the vendor liability for withdrawn stock.' },
        { label: 'Pay vendor:', text: 'Process the resulting payable through the normal payment process.' },
      ],
    },
    {
      title: 'Common Movement Types',
      items: [
        { label: '101 K', text: 'Goods receipt into vendor consignment stock' },
        { label: '201 K', text: 'Withdraw consignment stock for a cost center' },
        { label: '261 K', text: 'Withdraw consignment stock for a production order' },
        { label: '411 K', text: 'Transfer consignment stock to own stock' },
        { label: '122 K', text: 'Return goods to vendor; movement and stock indicators depend on the process' },
      ],
    },
    {
      title: 'Transaction Codes',
      items: [
        { label: 'ME11', text: 'Create consignment info record' },
        { label: 'ME21N', text: 'Create purchase order with item category K' },
        { label: 'MIGO', text: 'Post goods receipts and stock transfers' },
        { label: 'MMBE / MB58', text: 'Review stock overview or vendor consignment stock, where available' },
        { label: 'MRKO', text: 'Settle vendor consignment liabilities' },
        { label: 'F110 / F-53', text: 'Process vendor payments' },
      ],
    },
  ],
};

const P2PStepDetails = ({ sections }: { sections: P2PDetailSection[] }) => (
  <div className="mt-4 space-y-5 border-t border-slate-100 pt-4 text-sm text-slate-600">
    {sections.map((section) => (
      <section key={section.title}>
        <h5 className="mb-1 font-bold text-slate-800">{section.title}</h5>
        {section.description && <p className="leading-relaxed">{section.description}</p>}
        {section.items && (
          section.ordered ? (
            <ol className="list-decimal space-y-1.5 pl-5 leading-relaxed">
              {section.items.map((item) => (
                <li key={`${item.label ?? ''}${item.text}`}>
                  {item.label && <strong>{item.label} </strong>}
                  {item.text}
                </li>
              ))}
            </ol>
          ) : (
            <ul className="list-disc space-y-1.5 pl-5 leading-relaxed">
              {section.items.map((item) => (
                <li key={`${item.label ?? ''}${item.text}`}>
                  {item.label && <strong>{item.label} </strong>}
                  {item.text}
                </li>
              ))}
            </ul>
          )
        )}
      </section>
    ))}
  </div>
);

const P2PSection = () => {
  const [isPrDetailsOpen, setIsPrDetailsOpen] = useState(false);
  const [expandedSteps, setExpandedSteps] = useState<string[]>([]);
  const [expandedSpecialProcesses, setExpandedSpecialProcesses] = useState<string[]>([]);

  const toggleStepDetails = (title: string) => {
    setExpandedSteps((expanded) =>
      expanded.includes(title) ? expanded.filter((step) => step !== title) : [...expanded, title]
    );
  };

  const toggleSpecialProcess = (process: string) => {
    setExpandedSpecialProcesses((expanded) =>
      expanded.includes(process) ? expanded.filter((item) => item !== process) : [...expanded, process]
    );
  };

  const steps = [
    { title: 'Requirement', tcode: 'ME51N', desc: 'Purchase Requisition (PR)', icon: ClipboardCheck },
    { title: 'Sourcing', tcode: 'ME41', desc: 'RFQ & Vendor Selection', icon: Search },
    { title: 'Order', tcode: 'ME21N', desc: 'Purchase Order (PO)', icon: ShoppingCart },
    { title: 'Receipt', tcode: 'MIGO', desc: 'Goods Receipt (GR)', icon: Truck },
    { title: 'Invoice', tcode: 'MIRO', desc: 'Invoice Verification', icon: FileText },
    { title: 'Payment', tcode: 'F110', desc: 'Vendor Payment', icon: CreditCard },
  ];
  return (
    <div className="space-y-8">
      <div className="relative border-l-4 border-blue-200 ml-4 space-y-8">
        {steps.map((step, index) => (
          <div key={index} className="relative pl-8">
            <div className="absolute -left-[21px] top-0 bg-blue-600 text-white rounded-full w-10 h-10 flex items-center justify-center font-bold z-10 shadow-md">
              {index + 1}
            </div>
            <div className="bg-white p-4 rounded-lg shadow border border-slate-100 hover:border-blue-300 transition-colors">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-bold text-lg text-slate-800">{step.title}</h4>
                  <p className="text-slate-600 font-medium">{step.desc}</p>
                </div>
                <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs font-mono font-bold">
                  {step.tcode}
                </span>
              </div>
              {step.title === 'Requirement' && (
                <div className="mt-4 border-t border-slate-100 pt-3">
                  <button
                    type="button"
                    aria-expanded={isPrDetailsOpen}
                    aria-controls="purchase-requisition-details"
                    onClick={() => setIsPrDetailsOpen((isOpen) => !isOpen)}
                    className="flex items-center gap-2 rounded-md text-sm font-semibold text-blue-700 hover:text-blue-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                  >
                    {isPrDetailsOpen ? 'Hide' : 'Learn more about'} Purchase Requisitions
                    <ChevronDown
                      aria-hidden="true"
                      size={16}
                      className={`transition-transform ${isPrDetailsOpen ? 'rotate-180' : ''}`}
                    />
                  </button>
                  <div
                    id="purchase-requisition-details"
                    hidden={!isPrDetailsOpen}
                    className="mt-4 space-y-5 text-sm text-slate-600"
                  >
                    <section>
                      <h5 className="mb-1 font-bold text-slate-800">What is a Purchase Requisition?</h5>
                      <p className="leading-relaxed">
                        A Purchase Requisition (PR) is a formal internal document that tells the procurement
                        department that specific materials or services are needed. Unlike a Purchase Order (PO), it
                        is not sent to external vendors and creates no legal or financial liability. It starts the
                        internal procurement lifecycle.
                      </p>
                    </section>
                    <section>
                      <h5 className="mb-2 font-bold text-slate-800">Key Features</h5>
                      <ul className="list-disc space-y-1.5 pl-5 leading-relaxed">
                        <li><strong>Internal control:</strong> Lets departments validate needs before company funds are committed.</li>
                        <li><strong>Flexible creation:</strong> Employees can create PRs manually, or the system can generate them (for example, through MRP when stock is low).</li>
                        <li><strong>Detailed line items:</strong> Records material or service, quantity, required delivery date, receiving plant, and storage location.</li>
                        <li><strong>Approval accountability:</strong> Routes requests through the organization’s release strategy before they proceed to purchasing.</li>
                      </ul>
                    </section>
                    <section>
                      <h5 className="mb-2 font-bold text-slate-800">Main Transaction Codes</h5>
                      <div className="overflow-x-auto">
                        <table className="w-full min-w-[32rem] text-left">
                          <thead>
                            <tr className="border-b border-slate-200 text-xs uppercase text-slate-500">
                              <th className="py-2 pr-4">T-Code</th>
                              <th className="py-2">Purpose</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {[
                              ['ME51N', 'Create a new Purchase Requisition'],
                              ['ME52N', 'Change a Purchase Requisition'],
                              ['ME53N', 'Display a Purchase Requisition'],
                              ['ME54N', 'Release an individual Purchase Requisition'],
                              ['ME55', 'Release multiple Purchase Requisitions collectively'],
                              ['ME5A', 'Display and report on Purchase Requisitions'],
                            ].map(([code, purpose]) => (
                              <tr key={code}>
                                <td className="py-2 pr-4 font-mono font-semibold text-blue-700">{code}</td>
                                <td className="py-2">{purpose}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </section>
                    <section>
                      <h5 className="mb-2 font-bold text-slate-800">Common Types of PRs</h5>
                      <ol className="list-decimal space-y-1.5 pl-5 leading-relaxed">
                        <li><strong>Stock PR:</strong> Procures materials for warehouse inventory or safety stock.</li>
                        <li><strong>Consumption PR:</strong> Requests materials for direct use, assigned to a cost center, asset, or WBS project.</li>
                        <li><strong>Service PR:</strong> Requests external services such as equipment maintenance or consulting.</li>
                        <li><strong>Subcontracting PR:</strong> Requests processing of supplied raw materials by a specialized vendor.</li>
                        <li><strong>Stock transfer PR:</strong> Requests an internal inventory transfer between plants or storage locations.</li>
                      </ol>
                    </section>
                    <section>
                      <h5 className="mb-2 font-bold text-slate-800">PR Process Flow</h5>
                      <ol className="list-decimal space-y-1.5 pl-5 leading-relaxed">
                        <li><strong>Requirement determination:</strong> A department identifies a need manually, or MRP detects a shortage.</li>
                        <li><strong>PR creation (ME51N):</strong> The request records what is needed, how much, and when.</li>
                        <li><strong>System audit and validation:</strong> The system checks configured budget and technical constraints.</li>
                        <li><strong>Manager approval (ME54N):</strong> The release strategy routes the PR to approvers based on configured criteria such as value, plant, or department.</li>
                        <li><strong>Source determination:</strong> Procurement identifies suppliers or applicable contract terms for the approved request.</li>
                        <li><strong>PO conversion (ME21N):</strong> Purchasing references the approved PR to create the vendor-facing Purchase Order.</li>
                      </ol>
                    </section>
                  </div>
                </div>
              )}
              {P2P_STEP_DETAILS[step.title] && (
                <div className="mt-4 border-t border-slate-100 pt-3">
                  <button
                    type="button"
                    aria-expanded={expandedSteps.includes(step.title)}
                    aria-controls={`p2p-${step.title.toLowerCase()}-details`}
                    onClick={() => toggleStepDetails(step.title)}
                    className="flex items-center gap-2 rounded-md text-sm font-semibold text-blue-700 hover:text-blue-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                  >
                    {expandedSteps.includes(step.title) ? 'Hide' : 'Learn more about'} {step.title}
                    <ChevronDown
                      aria-hidden="true"
                      size={16}
                      className={`transition-transform ${expandedSteps.includes(step.title) ? 'rotate-180' : ''}`}
                    />
                  </button>
                  <div
                    id={`p2p-${step.title.toLowerCase()}-details`}
                    hidden={!expandedSteps.includes(step.title)}
                  >
                    <P2PStepDetails sections={P2P_STEP_DETAILS[step.title]} />
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 mt-6">
        <h3 className="font-bold text-slate-800 mb-3">Special Procurement Processes</h3>
        <div className="grid gap-4">
          {[
            {
              id: 'sto',
              title: 'Stock Transport Order (STO)',
              description: 'Move inventory between supplying and receiving plants, within one company code or across company codes.',
            },
            {
              id: 'subcontracting',
              title: 'Subcontracting (Item Category L)',
              description: 'Provide components to a vendor for processing or assembly into a finished product.',
            },
            {
              id: 'consignment',
              title: 'Vendor Consignment (Item Category: K)',
              description: 'Store vendor-owned materials at your site and settle for quantities withdrawn or transferred to own stock.',
            },
          ].map((process) => {
            const isExpanded = expandedSpecialProcesses.includes(process.id);
            const panelId = `special-procurement-${process.id}-details`;

            return (
              <div key={process.id} className="rounded border border-slate-200 bg-white p-4">
                <h4 className="mb-1 font-bold text-blue-700">{process.title}</h4>
                <p className="text-sm text-slate-600">{process.description}</p>
                <button
                  type="button"
                  aria-expanded={isExpanded}
                  aria-controls={panelId}
                  onClick={() => toggleSpecialProcess(process.id)}
                  className="mt-3 flex items-center gap-2 rounded-md text-sm font-semibold text-blue-700 hover:text-blue-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                >
                  {isExpanded ? 'Hide details' : 'Learn more'}
                  <ChevronDown
                    aria-hidden="true"
                    size={16}
                    className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                  />
                </button>
                <div id={panelId} hidden={!isExpanded}>
                  <P2PStepDetails sections={SPECIAL_PROCUREMENT_DETAILS[process.id]} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const MasterDataSection = () => (
  <div className="space-y-8 animate-fadeIn">
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
      <h3 className="text-xl font-bold text-blue-900 mb-3 flex items-center gap-2">
        <Database className="w-5 h-5" /> What is Master Data?
      </h3>
      <p className="text-slate-700 leading-relaxed">
        Master data is the core, relatively static information that defines key business entities (people, places,
        things) and serves as the foundation for transactions. It is created centrally, used repeatedly across modules
        (e.g., SD, MM, FI), and ensures data consistency across the enterprise.
      </p>
    </div>

    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <Users className="w-5 h-5 text-blue-600" /> 1. Business Partner (BP)
        </h3>
        <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-mono font-bold">
          T-Code: BP
        </span>
      </div>
      <p className="text-slate-600 text-sm mb-4 leading-relaxed">
        The central master data object used to create, manage, and store data for any person, organization, or group
        with whom a company has a business relationship.
      </p>
      <div className="grid md:grid-cols-2 gap-4 mt-2">
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
          <h4 className="font-bold text-xs uppercase text-slate-500 mb-2 tracking-wider">Key Aspects</h4>
          <ul className="text-xs text-slate-700 space-y-2">
            <li className="flex gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1 flex-shrink-0" />
              <span><strong>Centralized:</strong> Single record for name, address, bank, tax.</span>
            </li>
            <li className="flex gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1 flex-shrink-0" />
              <span><strong>Roles:</strong> Determines use (Supplier, Customer, etc.).</span>
            </li>
            <li className="flex gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1 flex-shrink-0" />
              <span><strong>Integration:</strong> CVI automatically creates vendor/customer records.</span>
            </li>
          </ul>
        </div>
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
          <h4 className="font-bold text-xs uppercase text-slate-500 mb-2 tracking-wider">Categories & Benefits</h4>
          <ul className="text-xs text-slate-700 space-y-2">
            <li className="flex gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-green-400 mt-1 flex-shrink-0" />
              <span><strong>Categories:</strong> Person, Group, or Organization.</span>
            </li>
            <li className="flex gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-green-400 mt-1 flex-shrink-0" />
              <span><strong>Redundancy:</strong> Reduces duplicate data across the system.</span>
            </li>
            <li className="flex gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-green-400 mt-1 flex-shrink-0" />
              <span><strong>Relationships:</strong> Manages parent/subsidiary links.</span>
            </li>
          </ul>
        </div>
      </div>
    </div>

    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <Box className="w-5 h-5 text-blue-600" /> 2. Material Master
        </h3>
        <div className="flex gap-1">
          {['MM01', 'MM02', 'MM03'].map((c) => (
            <span key={c} className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-[10px] font-mono font-bold">
              {c}
            </span>
          ))}
        </div>
      </div>
      <p className="text-slate-600 text-sm mb-4 leading-relaxed">
        The central, unified data repository containing all information on materials a company procures, produces,
        stores, and sells.
      </p>
      <div className="space-y-4">
        <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100">
          <h4 className="font-bold text-sm text-blue-800 mb-2">Key Data Views</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
            <div className="bg-white p-2 rounded shadow-sm border border-blue-50">
              <strong>Basic Data:</strong> Unit, Weight (Global)
            </div>
            <div className="bg-white p-2 rounded shadow-sm border border-blue-50">
              <strong>Purchasing:</strong> Order unit, Tax data
            </div>
            <div className="bg-white p-2 rounded shadow-sm border border-blue-50">
              <strong>MRP:</strong> Reorder point, Lot size
            </div>
            <div className="bg-white p-2 rounded shadow-sm border border-blue-50">
              <strong>Accounting:</strong> Price control, Valuation
            </div>
            <div className="bg-white p-2 rounded shadow-sm border border-blue-50">
              <strong>Sales:</strong> Dist. channel, Sales unit
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border border-slate-100 p-3 rounded-xl">
            <h4 className="font-bold text-xs text-slate-500 mb-2 uppercase">Material Types</h4>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="bg-slate-50 px-2 py-1 rounded flex items-center justify-between">
                <span>ROH</span> <span className="text-slate-400">Raw</span>
              </div>
              <div className="bg-slate-50 px-2 py-1 rounded flex items-center justify-between">
                <span>FERT</span> <span className="text-slate-400">Finished</span>
              </div>
              <div className="bg-slate-50 px-2 py-1 rounded flex items-center justify-between">
                <span>HALB</span> <span className="text-slate-400">Semi-fin</span>
              </div>
              <div className="bg-slate-50 px-2 py-1 rounded flex items-center justify-between">
                <span>HAWA</span> <span className="text-slate-400">Trading</span>
              </div>
            </div>
          </div>
          <div className="border border-slate-100 p-3 rounded-xl">
            <h4 className="font-bold text-xs text-slate-500 mb-2 uppercase">Org Levels</h4>
            <div className="flex gap-2 flex-wrap text-[11px]">
              <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Client</span>
              <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Plant</span>
              <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Storage Location</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div className="grid md:grid-cols-2 gap-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Info className="w-5 h-5 text-blue-600" /> 3. Info Record (PIR)
          </h3>
          <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs font-mono font-bold">ME11</span>
        </div>
        <p className="text-slate-600 text-sm mb-4 flex-1">
          Defines the specific relationship between a vendor and a material. Links vendor master and material master to
          automate PO data entry.
        </p>
        <ul className="text-xs text-slate-700 space-y-2 border-t pt-4">
          <li className="flex gap-2"><CheckCircle className="w-3.5 h-3.5 text-green-500" /> Pricing: Discounts & freight.</li>
          <li className="flex gap-2"><CheckCircle className="w-3.5 h-3.5 text-green-500" /> Logistics: Lead times & MOQ.</li>
          <li className="flex gap-2"><CheckCircle className="w-3.5 h-3.5 text-green-500" /> Limits: Delivery tolerances.</li>
        </ul>
      </div>
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Link className="w-5 h-5 text-blue-600" /> 4. Source List
          </h3>
          <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs font-mono font-bold">ME01</span>
        </div>
        <p className="text-slate-600 text-sm mb-4 flex-1">
          Managing approved suppliers for a material within a plant. Defines which sources are valid over a specific
          time.
        </p>
        <ul className="text-xs text-slate-700 space-y-2 border-t pt-4">
          <li className="flex gap-2"><CheckCircle className="w-3.5 h-3.5 text-blue-500" /> Purpose: Approved vendor lists.</li>
          <li className="flex gap-2"><CheckCircle className="w-3.5 h-3.5 text-blue-500" /> Controls: Blocked vs. Fixed sources.</li>
          <li className="flex gap-2"><CheckCircle className="w-3.5 h-3.5 text-blue-500" /> Automation: Manual or Collective proc.</li>
        </ul>
      </div>
    </div>
  </div>
);

const MovementSection = () => {
  const [filter, setFilter] = useState('All');
  const movements = [
    { code: '101', desc: 'Goods Receipt for Purchase Order', category: 'Receipt' },
    { code: '102', desc: 'Reversal of 101', category: 'Receipt' },
    { code: '105', desc: 'GR into Blocked Stock', category: 'Receipt' },
    { code: '201', desc: 'GI to Cost Center', category: 'Issue' },
    { code: '261', desc: 'GI to Production Order', category: 'Issue' },
    { code: '601', desc: 'GI for Sales Order', category: 'Issue' },
    { code: '311', desc: 'Storage Loc to Storage Loc (1-step)', category: 'Transfer' },
    { code: '301', desc: 'Plant to Plant (1-step)', category: 'Transfer' },
    { code: '321', desc: 'Quality Insp. → Unrestricted', category: 'Posting' },
    { code: '343', desc: 'Unrestricted → Blocked', category: 'Posting' },
  ];
  const filtered = filter === 'All' ? movements : movements.filter((m) => m.category === filter);
  return (
    <div>
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {['All', 'Receipt', 'Issue', 'Transfer', 'Posting'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              filter === f ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
            }`}
          >
            {f}
          </button>
        ))}
      </div>
      <div className="grid gap-3">
        {filtered.map((m) => (
          <div
            key={m.code}
            className="flex items-center justify-between bg-white p-4 rounded-lg shadow-sm border-l-4 hover:shadow-md transition-all"
            style={{
              borderLeftColor:
                m.category === 'Receipt' ? '#22c55e' : m.category === 'Issue' ? '#ef4444' : '#3b82f6',
            }}
          >
            <div className="flex items-center gap-4">
              <span className="font-mono text-xl font-bold text-slate-700 w-12">{m.code}</span>
              <div>
                <div className="font-semibold text-slate-800">{m.desc}</div>
                <div className="text-xs text-slate-500 uppercase">{m.category}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const AgreementsSection = () => {
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const details = [
    {
      title: 'Definition',
      description:
        'An Outline Agreement is a long-term purchasing agreement between an organization and a vendor. It defines requirements for materials or services, negotiated prices and conditions, and validity periods for future procurement.',
    },
    {
      title: 'Key Features',
      items: [
        { label: 'Validity period:', text: 'Applies for a defined start and end date.' },
        { label: 'Pre-negotiated pricing:', text: 'Can define prices, discounts, and scale conditions in advance.' },
        { label: 'Target commitments:', text: 'Can be based on a target quantity or target value.' },
        { label: 'Reduced administrative work:', text: 'Supports recurring procurement without renegotiating terms for every order.' },
        { label: 'Header and item structure:', text: 'Includes agreement-level vendor and validity data, plus item-level materials, target quantities or values, and prices.' },
      ],
    },
    {
      title: 'Types of Outline Agreements',
      items: [
        { label: 'Quantity Contract (MK):', text: 'A contract capped by a total agreed quantity; follow-on release orders are created when goods are needed.' },
        { label: 'Value Contract (WK):', text: 'A contract capped by an agreed total monetary value.' },
        { label: 'Scheduling Agreement (LP / LPA):', text: 'An agreement with delivery schedule lines that specify quantities and dates; can integrate with MRP depending on configuration.' },
      ],
    },
    {
      title: 'Contract Process Flow',
      ordered: true,
      items: [
        { label: 'Create contract (ME31K):', text: 'Create a quantity or value contract with the vendor.' },
        { label: 'Release contract (ME35K):', text: 'Approve or release it if a release workflow is active.' },
        { label: 'Create release order (ME21N):', text: 'Create a purchase order referencing the contract when goods or services are required.' },
        { label: 'Receive goods (MIGO):', text: 'Post the goods receipt against the release order.' },
        { label: 'Verify invoice (MIRO):', text: 'Process the vendor invoice.' },
      ],
    },
    {
      title: 'Scheduling Agreement Process Flow',
      ordered: true,
      items: [
        { label: 'Create scheduling agreement (ME31L):', text: 'Create the agreement with the vendor.' },
        { label: 'Maintain schedule lines (ME38):', text: 'Maintain delivery quantities and dates.' },
        { label: 'Receive goods (MIGO):', text: 'Post goods receipts against the scheduling agreement.' },
        { label: 'Verify invoice (MIRO):', text: 'Process the vendor invoice.' },
      ],
    },
    {
      title: 'Transaction Codes',
      items: [
        { label: 'ME31K / ME32K / ME33K:', text: 'Create, change, and display contract' },
        { label: 'ME34K:', text: 'Maintain contract supplement' },
        { label: 'ME35K:', text: 'Release / approve contract' },
        { label: 'ME9K:', text: 'Contract output' },
        { label: 'ME31L / ME32L / ME33L:', text: 'Create, change, and display scheduling agreement' },
        { label: 'ME38:', text: 'Maintain scheduling agreement schedule lines' },
        { label: 'ME35L:', text: 'Release scheduling agreement' },
        { label: 'ME3L / ME3M / ME3C:', text: 'List outline agreements by vendor, material, or material group' },
        { label: 'ME3N / ME3K:', text: 'List by agreement number or account assignment' },
        { label: 'ME80R:', text: 'General outline agreement reporting' },
      ],
    },
  ];

  return (
  <div className="space-y-6">
    <div className="bg-white p-6 rounded-xl border border-slate-200">
      <h3 className="text-xl font-bold text-blue-900 mb-2">Outline Agreements</h3>
      <p className="text-slate-600 mb-4">
        Review the definition, key features, agreement types, process flows, and related transaction codes.
      </p>
      <button
        type="button"
        aria-expanded={isDetailsOpen}
        aria-controls="outline-agreement-details"
        onClick={() => setIsDetailsOpen((isOpen) => !isOpen)}
        className="flex items-center gap-2 rounded-md text-sm font-semibold text-blue-700 hover:text-blue-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
      >
        {isDetailsOpen ? 'Hide details' : 'Learn more about Outline Agreements'}
        <ChevronDown
          aria-hidden="true"
          size={16}
          className={`transition-transform ${isDetailsOpen ? 'rotate-180' : ''}`}
        />
      </button>
      <div id="outline-agreement-details" hidden={!isDetailsOpen}>
        <P2PStepDetails sections={details} />
      </div>
    </div>
    <div className="bg-white p-6 rounded-xl border border-slate-200">
      <h3 className="text-xl font-bold text-blue-900 mb-4">Contracts</h3>
      <p className="text-slate-600 mb-4">
        Long-term agreement without specific delivery dates. Created via <strong>ME31K</strong>.
      </p>
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-slate-50 p-3 rounded">
          <div className="font-bold">Quantity Contract (MK)</div>
          <div className="text-xs text-slate-500">Total quantity known</div>
        </div>
        <div className="bg-slate-50 p-3 rounded">
          <div className="font-bold">Value Contract (WK)</div>
          <div className="text-xs text-slate-500">Total value known</div>
        </div>
      </div>
    </div>
    <div className="bg-white p-6 rounded-xl border border-slate-200">
      <h3 className="text-xl font-bold text-blue-900 mb-4">Scheduling Agreements</h3>
      <p className="text-slate-600 mb-2">
        Long-term agreement <strong>with</strong> specific delivery dates (Schedule Lines).
      </p>
      <p className="text-sm text-slate-500">
        Used for Just-In-Time (JIT) procurement. Created via <strong>ME31L</strong>.
      </p>
    </div>
  </div>
  );
};

const InventorySection = () => {
  const processSteps = [
    { code: 'MI01 / MI31', label: 'Create PI Document', icon: ClipboardCheck, desc: 'Initiates count for specific materials/plant. Often blocks movements.' },
    { code: 'MI21', label: 'Print Document', icon: Printer, desc: 'Paper forms for warehouse staff to record physical findings.' },
    { code: 'N/A', label: 'Physical Count', icon: Box, desc: 'Staff physically count goods on the warehouse floor.' },
    { code: 'MI04', label: 'Enter Count Results', icon: CheckCircle, desc: 'Results typed into SAP. "Zero count" indicator used if stock is empty.' },
    { code: 'MI20', label: 'Analyze Differences', icon: FileSearch, desc: 'System stock vs. Counted stock. Discrepancies identified.' },
    { code: 'MI11', label: 'Recount (Optional)', icon: RefreshCw, desc: 'Requested if significant discrepancies require verification.' },
    { code: 'MI07', label: 'Post Differences', icon: ArrowRightLeft, desc: 'Final adjustment of book inventory and accounting (701 Gain / 702 Loss).' },
  ];

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-blue-100 p-2 rounded-lg">
            <ClipboardCheck className="text-blue-700 w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-slate-800">Process Overview</h3>
        </div>
        <p className="text-slate-700 leading-relaxed mb-4">
          Physical Inventory in SAP MM is a <strong>critical, legally mandated process</strong> used to ensure that
          the inventory quantities recorded in the SAP system match the actual physical stock present in a warehouse
          or storage location.
        </p>
        <div className="bg-amber-50 border-l-4 border-amber-400 p-4 text-sm text-amber-800 italic">
          It involves counting physical goods, entering those counts, analyzing discrepancies, and updating the system
          to reflect reality.
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="font-bold text-slate-800 px-1">Physical Inventory Process Flow (MM-IM)</h4>
        <div className="grid gap-3">
          {processSteps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <div key={idx} className="flex gap-4 group">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 ${idx === processSteps.length - 1 ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-slate-300 text-slate-500'}`}
                  >
                    {idx + 1}
                  </div>
                  {idx !== processSteps.length - 1 && (
                    <div className="w-0.5 flex-1 bg-slate-200 my-1 group-hover:bg-blue-200 transition-colors"></div>
                  )}
                </div>
                <div className="bg-white flex-1 p-4 rounded-xl border border-slate-100 shadow-sm group-hover:border-blue-200 transition-all mb-2">
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-bold text-slate-800 flex items-center gap-2">
                      <Icon className="w-4 h-4 text-blue-500" /> {step.label}
                    </span>
                    <span className="font-mono text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-600 font-bold">
                      {step.code}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">{step.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-slate-900 rounded-2xl p-6 text-white">
        <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
          <Hash className="text-blue-400" /> Main Transaction Codes
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { c: 'MI01', d: 'Create PI Doc (Individual)' },
            { c: 'MI31', d: 'Create PI Doc (Batch)' },
            { c: 'MI02', d: 'Change PI Doc' },
            { c: 'MI03', d: 'Display PI Doc' },
            { c: 'MI21', d: 'Print PI Doc' },
            { c: 'MI04', d: 'Enter Count' },
            { c: 'MI05', d: 'Change Count' },
            { c: 'MI07', d: 'Post Difference' },
            { c: 'MI20', d: 'Difference Analysis' },
            { c: 'MI11', d: 'Create Recount Doc' },
            { c: 'MI24', d: 'Doc List (Reports)' },
            { c: 'MI10', d: 'Enter & Post (1-Step)' },
          ].map((item) => (
            <div
              key={item.c}
              className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg border border-slate-700 hover:bg-slate-800 transition-colors"
            >
              <span className="font-mono font-bold text-blue-400 text-sm min-w-[45px]">{item.c}</span>
              <span className="text-[11px] text-slate-300 font-medium">{item.d}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const TCodesSection = () => {
  const categories = [...new Set(T_CODE_DATABASE.map((t) => t.category))];
  return (
    <div className="space-y-8 animate-fadeIn">
      {categories.map((cat) => (
        <div key={cat} className="space-y-4">
          <h3 className="text-lg font-bold text-blue-800 flex items-center gap-2 border-b border-blue-100 pb-2">
            <span className="w-2 h-6 bg-blue-600 rounded-full"></span>
            {cat} Transactions
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {T_CODE_DATABASE.filter((t) => t.category === cat).map((t) => (
              <div
                key={t.code}
                className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 hover:border-blue-300 transition-all flex items-center gap-4 group"
              >
                <div className="bg-slate-100 px-3 py-2 rounded-lg font-mono font-bold text-blue-700 group-hover:bg-blue-600 group-hover:text-white transition-colors min-w-[80px] text-center">
                  {t.code}
                </div>
                <div className="text-slate-700 text-sm font-medium">{t.desc}</div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

const QuizSection = () => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const questions = [
    { q: 'What is the T-Code for Goods Receipt?', options: ['ME21N', 'MIGO', 'MIRO', 'MM01'], ans: 'MIGO' },
    { q: 'Which organizational unit is the smallest for external accounting?', options: ['Plant', 'Client', 'Company Code', 'Storage Location'], ans: 'Company Code' },
    { q: 'Movement type 101 refers to:', options: ['Goods Issue', 'Transfer Posting', 'Goods Receipt', 'Blocked Stock'], ans: 'Goods Receipt' },
    { q: "What does 'K' stand for in Item Category?", options: ['Standard', 'Subcontracting', 'Consignment', 'Service'], ans: 'Consignment' },
    { q: 'Which Master Data view is valid for all plants?', options: ['Purchasing', 'MRP', 'Basic Data', 'Accounting'], ans: 'Basic Data' },
  ];
  const handleAnswer = (option: string) => {
    setSelectedOption(option);
    const correct = option === questions[currentQuestion].ans;
    setIsCorrect(correct);
    if (correct) setScore(score + 1);
    setTimeout(() => {
      if (currentQuestion < questions.length - 1) {
        setCurrentQuestion(currentQuestion + 1);
        setSelectedOption(null);
        setIsCorrect(null);
      } else {
        setShowResult(true);
      }
    }, 1500);
  };
  const resetQuiz = () => {
    setScore(0);
    setCurrentQuestion(0);
    setShowResult(false);
    setSelectedOption(null);
    setIsCorrect(null);
  };
  if (showResult) {
    return (
      <div className="text-center bg-white p-10 rounded-xl shadow-lg">
        <h3 className="text-2xl font-bold mb-4">Quiz Complete!</h3>
        <div className="text-4xl font-bold text-blue-600 mb-4">
          {score} / {questions.length}
        </div>
        <button onClick={resetQuiz} className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition">
          Retry Quiz
        </button>
      </div>
    );
  }
  return (
    <div className="max-w-xl mx-auto">
      <div className="bg-white p-6 rounded-xl shadow-lg border border-slate-100">
        <div className="flex justify-between items-center mb-6">
          <span className="text-xs font-bold text-slate-400 uppercase">
            Question {currentQuestion + 1}/{questions.length}
          </span>
          <span className="text-xs font-bold bg-blue-100 text-blue-800 px-2 py-1 rounded">Score: {score}</span>
        </div>
        <h3 className="text-xl font-bold text-slate-800 mb-6">{questions[currentQuestion].q}</h3>
        <div className="space-y-3">
          {questions[currentQuestion].options.map((opt) => (
            <button
              key={opt}
              onClick={() => handleAnswer(opt)}
              disabled={selectedOption !== null}
              className={`w-full text-left p-4 rounded-lg border transition-all ${
                selectedOption === opt
                  ? isCorrect
                    ? 'bg-green-100 border-green-500'
                    : 'bg-red-100 border-red-500'
                  : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

// --- MAIN APP ---

const SapLearningModule = () => {
  const [activeSection, setActiveSection] = useState(SECTION_KEYS.INTRO);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [tcodeSearch, setTcodeSearch] = useState('');

  const renderContent = () => {
    switch (activeSection) {
      case SECTION_KEYS.INTRO: return <IntroSection />;
      case SECTION_KEYS.MODULES: return <ModulesSection />;
      case SECTION_KEYS.ORG_STRUCTURE: return <OrgStructureSection />;
      case SECTION_KEYS.P2P: return <P2PSection />;
      case SECTION_KEYS.MASTER_DATA: return <MasterDataSection />;
      case SECTION_KEYS.AGREEMENTS: return <AgreementsSection />;
      case SECTION_KEYS.MOVEMENT: return <MovementSection />;
      case SECTION_KEYS.PHYSICAL_INV: return <InventorySection />;
      case SECTION_KEYS.T_CODES: return <TCodesSection />;
      case SECTION_KEYS.QUIZ: return <QuizSection />;
      default: return <IntroSection />;
    }
  };

  const getSectionTitle = () => NAV_ITEMS.find((n) => n.id === activeSection)?.label;

  const filteredTCodes = useMemo(() => {
    if (!tcodeSearch) return [];
    return T_CODE_DATABASE.filter(
      (item) =>
        item.code.toLowerCase().includes(tcodeSearch.toLowerCase()) ||
        item.desc.toLowerCase().includes(tcodeSearch.toLowerCase()),
    );
  }, [tcodeSearch]);

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 font-sans flex flex-col md:flex-row">
      {/* Mobile Header */}
      <div className="md:hidden bg-blue-900 text-white p-4 flex justify-between items-center shadow-md z-50">
        <div className="flex flex-col">
          <h1 className="font-bold text-lg leading-none">CIC</h1>
          <span className="text-[10px] text-blue-200 uppercase tracking-wider">MM Module</span>
        </div>
        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
          {isSidebarOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Sidebar */}
      <aside
        className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-white shadow-xl transform transition-transform duration-300 ease-in-out
        md:relative md:translate-x-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}
      >
        <div className="p-8 border-b border-slate-100 bg-blue-900 text-white flex flex-col items-center">
          <h1 className="text-3xl font-bold tracking-tight">CIC</h1>
          <p className="text-blue-200 text-xs mt-1 font-medium uppercase tracking-widest">MM Module</p>
        </div>

        <nav className="p-4 space-y-1 h-[calc(100vh-220px)] overflow-y-auto custom-scrollbar">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveSection(item.id);
                  setIsSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  activeSection === item.id ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Icon className="w-5 h-5" />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 w-full p-4 bg-slate-50 border-t border-slate-200">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Quick T-Code Finder..."
              className="w-full pl-8 pr-2 py-2 text-xs border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={tcodeSearch}
              onChange={(e) => setTcodeSearch(e.target.value)}
            />
          </div>
          {tcodeSearch && (
            <div className="absolute bottom-full left-0 w-full bg-white shadow-lg border border-slate-200 rounded-t-lg max-h-48 overflow-y-auto z-50">
              {filteredTCodes.length > 0 ? (
                filteredTCodes.map((t) => (
                  <div key={t.code} className="p-2 border-b border-slate-100 hover:bg-blue-50">
                    <div className="font-bold text-blue-700 text-[10px]">{t.code}</div>
                    <div className="text-[10px] text-slate-600 truncate">{t.desc}</div>
                  </div>
                ))
              ) : (
                <div className="p-2 text-[10px] text-slate-400">No match</div>
              )}
            </div>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto h-screen relative">
        <header className="mb-8">
          <h2 className="text-3xl font-bold text-slate-800">{getSectionTitle()}</h2>
          <div className="h-1 w-20 bg-blue-600 mt-2 rounded-full"></div>
        </header>
        <div className="max-w-4xl animate-slideIn">{renderContent()}</div>
      </main>

      <AIAssistant />
    </div>
  );
};

export default SapLearningModule;
