interface StatCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  color?: "blue" | "green" | "yellow" | "red" | "purple" | "slate";
  icon?: React.ReactNode;
}

const colors = {
  blue: "border-blue-500/20 bg-blue-500/5 text-blue-400",
  green: "border-green-500/20 bg-green-500/5 text-green-400",
  yellow: "border-yellow-500/20 bg-yellow-500/5 text-yellow-400",
  red: "border-red-500/20 bg-red-500/5 text-red-400",
  purple: "border-purple-500/20 bg-purple-500/5 text-purple-400",
  slate: "border-slate-700/50 bg-slate-800/30 text-slate-400",
};

export default function StatCard({
  label,
  value,
  subtext,
  color = "slate",
  icon,
}: StatCardProps) {
  return (
    <div
      className={`rounded-2xl border p-5 ${colors[color]}`}
    >
      <div className="flex items-start justify-between mb-2">
        <span className="text-xs font-medium uppercase tracking-wide opacity-70">
          {label}
        </span>
        {icon && <span className="text-lg opacity-60">{icon}</span>}
      </div>
      <div className="text-3xl font-bold text-white mt-1">{value}</div>
      {subtext && (
        <div className="text-xs mt-1 opacity-60">{subtext}</div>
      )}
    </div>
  );
}
