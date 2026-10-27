/**
 * Evaluation script for the SAP MM RAG Assistant.
 * Run: npx tsx server/eval.ts
 * (Assumes the backend is running on port 3001)
 */

const BASE_URL = 'http://localhost:3001';

interface EvalCase {
  question: string;
  expectedKeywords: string[];
  shouldReject?: boolean;
}

const TEST_CASES: EvalCase[] = [
  {
    question: 'What is the Procure-to-Pay cycle?',
    expectedKeywords: ['ME51N', 'ME21N', 'MIGO', 'MIRO', 'P2P'],
  },
  {
    question: 'What does T-code MIGO do?',
    expectedKeywords: ['Goods Receipt', 'movement', 'inventory'],
  },
  {
    question: 'How does MM integrate with FI?',
    expectedKeywords: ['GR/IR', 'accounting', 'OBYC', '101'],
  },
  {
    question: 'What is the difference between a Contract and a Scheduling Agreement?',
    expectedKeywords: ['ME31K', 'ME31L', 'delivery dates', 'JIT'],
  },
  {
    question: 'List all movement types for subcontracting.',
    expectedKeywords: ['541', '543', '101'],
  },
  {
    question: 'What is the 3-way match in invoice verification?',
    expectedKeywords: ['MIRO', 'Purchase Order', 'Goods Receipt', 'invoice'],
  },
  {
    question: 'What configuration is needed for PR release strategy?',
    expectedKeywords: ['CT04', 'CL02', 'Release Code'],
  },
  {
    question: 'Who won the FIFA World Cup in 2022?', // Should be rejected / out-of-scope
    expectedKeywords: ['cannot', 'knowledge base'],
    shouldReject: true,
  },
];

interface Result {
  question: string;
  passed: boolean;
  score: number;
  answer: string;
  missingKeywords?: string[];
  sources?: any[];
}

async function runEval() {
  console.log('🧪 Starting SAP MM RAG Evaluation\n' + '='.repeat(50));
  const results: Result[] = [];

  for (const tc of TEST_CASES) {
    try {
      const res = await fetch(`${BASE_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: tc.question }),
      });
      const data: any = await res.json();
      const answer: string = (data.answer || '').toLowerCase();

      const foundKeywords = tc.expectedKeywords.filter(k => answer.includes(k.toLowerCase()));
      const score = Math.round((foundKeywords.length / tc.expectedKeywords.length) * 100);
      const passed = score >= 60;

      results.push({
        question: tc.question,
        passed,
        score,
        answer: data.answer?.slice(0, 200) + '...',
        missingKeywords: tc.expectedKeywords.filter(k => !answer.includes(k.toLowerCase())),
        sources: data.sources,
      });

      const icon = passed ? '✅' : '❌';
      console.log(`\n${icon} [${score}%] Q: ${tc.question}`);
      if (!passed) {
        console.log(`   Missing keywords: ${results[results.length - 1].missingKeywords?.join(', ')}`);
      }
      if (data.sources?.length) {
        console.log(`   Sources: ${data.sources.map((s: any) => s.title).join(', ')}`);
      }
    } catch (e: any) {
      console.log(`❌ ERROR on "${tc.question}": ${e.message}`);
      results.push({ question: tc.question, passed: false, score: 0, answer: e.message });
    }
  }

  const passed = results.filter(r => r.passed).length;
  const avgScore = Math.round(results.reduce((s, r) => s + r.score, 0) / results.length);
  console.log('\n' + '='.repeat(50));
  console.log(`📊 Results: ${passed}/${results.length} passed | Average score: ${avgScore}%`);
}

runEval();
