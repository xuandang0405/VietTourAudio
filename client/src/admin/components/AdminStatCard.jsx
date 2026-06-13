import { ArrowDownRight, ArrowUpRight, AlertTriangle } from 'lucide-react';

const toneClasses = {
  blue: 'bg-blue-50 text-blue-600',
  green: 'bg-green-50 text-green-600',
  amber: 'bg-amber-50 text-amber-600',
  indigo: 'bg-indigo-50 text-indigo-600'
};

export function AdminStatCard({ label, value, helper, trend, tone = 'blue', icon: Icon }) {
  const TrendIcon = trend === 'warning' ? AlertTriangle : trend === 'down' ? ArrowDownRight : ArrowUpRight;

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-slate-500">{label}</p>
          <p className="mt-2 text-2xl font-black text-slate-950">{value}</p>
        </div>
        {Icon && (
          <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${toneClasses[tone] ?? toneClasses.blue}`}>
            <Icon size={21} />
          </span>
        )}
      </div>
      <div className="mt-4 flex items-center gap-1.5 text-xs font-black text-slate-500">
        <TrendIcon className={trend === 'warning' ? 'text-amber-500' : trend === 'down' ? 'text-red-500' : 'text-green-500'} size={15} />
        {helper}
      </div>
    </article>
  );
}
