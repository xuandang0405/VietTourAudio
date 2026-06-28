import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

export function StatChart({ data }) {
  return (
    <div className="w-full h-72 min-w-0 min-h-[240px] relative rounded-2xl border border-amber-100 bg-white p-3">
      <ResponsiveContainer width="100%" height="100%" minWidth={0} debounce={50}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="c1" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#d97706" stopOpacity={0.9} />
              <stop offset="95%" stopColor="#d97706" stopOpacity={0.06} />
            </linearGradient>
          </defs>
          <XAxis dataKey="day" />
          <YAxis />
          <Tooltip />
          <Area type="monotone" dataKey="plays" stroke="#92400e" fill="url(#c1)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
