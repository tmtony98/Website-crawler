import { memo, useState } from 'react';
import { Handle, Position } from '@xyflow/react';
import {
  Home,
  ShoppingCart,
  CreditCard,
  Search,
  Info,
  LogIn,
  LifeBuoy,
  List,
  FileText,
  Globe,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';

const TYPE_CONFIG = {
  home:     { icon: Home,         bg: 'bg-blue-50',    border: 'border-blue-300',   text: 'text-blue-700',   badge: 'bg-blue-100 text-blue-600' },
  listing:  { icon: List,         bg: 'bg-green-50',   border: 'border-green-300',  text: 'text-green-700',  badge: 'bg-green-100 text-green-600' },
  detail:   { icon: FileText,     bg: 'bg-amber-50',   border: 'border-amber-300',  text: 'text-amber-700',  badge: 'bg-amber-100 text-amber-600' },
  auth:     { icon: LogIn,        bg: 'bg-purple-50',  border: 'border-purple-300', text: 'text-purple-700', badge: 'bg-purple-100 text-purple-600' },
  cart:     { icon: ShoppingCart,  bg: 'bg-rose-50',    border: 'border-rose-300',   text: 'text-rose-700',   badge: 'bg-rose-100 text-rose-600' },
  checkout: { icon: CreditCard,   bg: 'bg-rose-50',    border: 'border-rose-400',   text: 'text-rose-800',   badge: 'bg-rose-100 text-rose-600' },
  search:   { icon: Search,       bg: 'bg-cyan-50',    border: 'border-cyan-300',   text: 'text-cyan-700',   badge: 'bg-cyan-100 text-cyan-600' },
  info:     { icon: Info,         bg: 'bg-slate-50',   border: 'border-slate-300',  text: 'text-slate-700',  badge: 'bg-slate-100 text-slate-600' },
  support:  { icon: LifeBuoy,     bg: 'bg-teal-50',    border: 'border-teal-300',   text: 'text-teal-700',   badge: 'bg-teal-100 text-teal-600' },
  page:     { icon: Globe,        bg: 'bg-gray-50',    border: 'border-gray-300',   text: 'text-gray-700',   badge: 'bg-gray-100 text-gray-600' },
};

function PageNode({ data }) {
  const [expanded, setExpanded] = useState(false);
  const config = TYPE_CONFIG[data.type] || TYPE_CONFIG.page;
  const Icon = config.icon;
  const hasPages = data.pages && data.pages.length > 1;

  return (
    <div className={`px-4 py-3 rounded-xl border-2 shadow-sm min-w-[180px] max-w-[300px] ${config.bg} ${config.border}`}>
      <Handle type="target" position={Position.Left} className="!bg-gray-400 !w-2 !h-2" />

      <div className="flex items-start gap-2">
        <div className={`mt-0.5 p-1.5 rounded-lg ${config.badge}`}>
          <Icon size={14} />
        </div>
        <div className="flex-1 min-w-0">
          <div className={`text-sm font-semibold leading-tight truncate ${config.text}`}>
            {data.label}
          </div>
          <div className="text-xs text-gray-400 mt-0.5 truncate font-mono">
            {data.path}
          </div>
          {hasPages && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setExpanded(!expanded);
              }}
              className={`flex items-center gap-1 text-[10px] mt-1 px-1.5 py-0.5 rounded-full font-medium cursor-pointer hover:opacity-80 ${config.badge}`}
            >
              {expanded ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
              {data.count} pages
            </button>
          )}
        </div>
      </div>

      {hasPages && expanded && (
        <div className="mt-2 pt-2 border-t border-gray-200/50 space-y-1 max-h-[200px] overflow-y-auto">
          {data.pages.map((page, i) => (
            <div key={i} className="text-[10px] leading-tight">
              <div className="text-gray-600 truncate">{page.title}</div>
              <div className="text-gray-400 font-mono truncate">{page.path}</div>
            </div>
          ))}
        </div>
      )}

      <Handle type="source" position={Position.Right} className="!bg-gray-400 !w-2 !h-2" />
    </div>
  );
}

export default memo(PageNode);
