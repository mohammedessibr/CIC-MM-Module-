import React from 'react';
import type { AnalysisData, ExecuteData } from './AICopilotLogic';
import { BarChart3, ClipboardCheck, ArrowRight, Zap, ShieldCheck, ShoppingCart } from 'lucide-react';

interface CardProps {
  data?: any;
  missingFields?: string[];
  suggestedVendors?: string[];
  onAction?: (action: string, payload?: any) => void;
}

export const SuggestedPOCard: React.FC<CardProps> = ({ data, onAction }) => {
  return (
    <div className="w-full max-w-sm rounded-lg border border-sky-100 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2 text-[#0478d8]">
        <ShoppingCart size={18} />
        <h3 className="font-semibold text-sm uppercase tracking-[0.2em]">Draft Purchase Order</h3>
      </div>
      <div className="space-y-3 rounded-lg bg-[#edf8ff] p-4 text-sm text-slate-700">
        <div className="flex justify-between">
          <span className="text-slate-500">Material</span>
          <span className="font-semibold capitalize">{data?.material || 'Unknown'}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">Quantity</span>
          <span className="font-semibold">{data?.quantity || 0}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">Vendor</span>
          <span className="font-semibold">{data?.vendor || 'Pending'}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">Department</span>
          <span className="font-semibold">{data?.department || 'N/A'}</span>
        </div>
      </div>
      <button
        type="button"
        onClick={() => onAction?.('submit_po')}
        className="mt-4 w-full rounded-lg bg-[#0478d8] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#0367bb]"
      >
        Submit Purchase Order
      </button>
    </div>
  );
};

export const MissingDataCard: React.FC<CardProps> = ({ missingFields }) => {
  return (
    <div className="w-full max-w-sm rounded-lg border border-amber-200 bg-amber-50 p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-3 text-orange-600">
        <ClipboardCheck size={18} />
        <h3 className="font-semibold text-sm uppercase tracking-[0.2em]">Missing Information</h3>
      </div>
      <p className="text-sm text-orange-800 mb-3">
        I need one or more details before I can continue with the simulation.
      </p>
      <ul className="space-y-2 text-sm text-orange-700">
        {missingFields?.map((field, idx) => (
          <li key={idx} className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-orange-600" />
            <span>{field}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export const AlternativeVendorsCard: React.FC<CardProps> = ({ data, suggestedVendors, onAction }) => {
  return (
    <div className="w-full max-w-sm rounded-lg border border-sky-100 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-3 text-emerald-600">
        <ShieldCheck size={18} />
        <h3 className="font-semibold text-sm uppercase tracking-[0.2em]">Approved Vendors</h3>
      </div>
      <p className="text-sm text-slate-600 mb-4">
        Select one of the approved vendors for {data?.material || 'this material'}.
      </p>
      <div className="space-y-3">
        {suggestedVendors?.map((vendor, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => onAction?.('select_vendor', vendor)}
            className="w-full rounded-lg border border-sky-100 bg-[#f5fbff] px-4 py-3 text-left text-sm font-medium text-slate-800 transition hover:border-[#0478d8] hover:bg-[#edf8ff]"
          >
            <div className="flex items-center justify-between">
              <span>{vendor}</span>
              <span className="rounded-full bg-[#dff3ff] px-3 py-1 text-[11px] font-semibold text-[#046bb1]">Select</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export const DataInsightCard: React.FC<{ data?: AnalysisData }> = ({ data }) => {
  if (!data) return null;
  return (
    <div className="w-full max-w-xl rounded-lg border border-sky-100 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3 mb-5">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Analysis</p>
          <h3 className="mt-2 text-lg font-semibold text-slate-900">{data.title}</h3>
        </div>
        <div className="inline-flex items-center gap-2 rounded-lg bg-[#edf8ff] px-3 py-2 text-sm font-semibold text-[#046bb1]">
          <BarChart3 size={16} /> Metrics
        </div>
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        {data.metrics.map((metric) => (
          <div key={metric.label} className="rounded-lg bg-[#edf8ff] p-4 text-sm">
            <p className="text-slate-500">{metric.label}</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">{metric.value}</p>
          </div>
        ))}
      </div>
      <div className="mt-5 rounded-lg bg-[#071121] px-5 py-4 text-sm text-slate-100">
        <h4 className="text-sm font-semibold text-white">Key insights</h4>
        <ul className="mt-3 space-y-2">
          {data.insights.map((insight) => (
            <li key={insight} className="flex items-start gap-2">
              <span className="mt-1 h-2.5 w-2.5 rounded-full bg-cyan-400" />
              <span>{insight}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="mt-5 overflow-hidden rounded-lg border border-sky-100 text-sm">
        <div className="grid grid-cols-[1.7fr_1fr_1fr] bg-slate-100 px-4 py-3 text-slate-600 font-semibold">
          <span>Vendor</span>
          <span>On-Time</span>
          <span>Rating</span>
        </div>
        <div className="divide-y divide-slate-200 bg-white">
          {data.table.map((row) => (
            <div key={row.vendor} className="grid grid-cols-[1.7fr_1fr_1fr] px-4 py-3 text-slate-700">
              <span>{row.vendor}</span>
              <span>{row.onTime}</span>
              <span>{row.rating}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export const ExecutionCard: React.FC<{ data?: ExecuteData; onAction?: (action: string, payload?: any) => void }> = ({ data, onAction }) => {
  if (!data) return null;

  return (
    <div className="w-full max-w-xl rounded-lg border border-sky-100 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3 mb-5">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Execution</p>
          <h3 className="mt-2 text-lg font-semibold text-slate-900">{data.title}</h3>
        </div>
        <div className="inline-flex items-center gap-2 rounded-lg bg-[#edf8ff] px-3 py-2 text-sm font-semibold text-[#046bb1]">
          <Zap size={16} /> {data.transaction}
        </div>
      </div>
      <p className="text-sm text-slate-600">{data.description}</p>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {data.fields.map((field) => (
          <div key={field.label} className="rounded-lg bg-[#edf8ff] p-4 text-sm">
            <p className="text-slate-500">{field.label}</p>
            <p className="mt-2 font-semibold text-slate-900">{field.value}</p>
          </div>
        ))}
      </div>
      {data.notes && <p className="mt-4 text-sm text-slate-500">{data.notes}</p>}
      <button
        type="button"
        onClick={() => onAction?.('confirm_execution', data.transaction)}
        className="mt-5 inline-flex items-center justify-center gap-2 rounded-lg bg-[#0478d8] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#0367bb]"
      >
        <ArrowRight size={16} /> Open {data.transaction}
      </button>
    </div>
  );
};
