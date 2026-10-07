function StatCard({ label, value, icon, color }) {
  const colorMap = {
    brand: "[background:#e8f0fb]",
    purple: "[background:#ede9fe]",
    teal: "[background:#e0f7fa]",
    orange: "[background:#fef3c7]",
    green: "[background:#dcfce7]",
  };
  const valueColorMap = {
    brand: "[color:#133f7d]",
    green: "[color:#22c55e]",
    orange: "[color:#f59e0b]",
    teal: "[color:#00b4d8]",
  };
  return (
    <div className="stat-card [background:#fff] [border:1px_solid_#e2e8f0] [border-radius:12px] [padding:18px] [position:relative]">
      <div className="stat-label [font-size:11px] [font-weight:700] [color:#64748b] [text-transform:uppercase] [letter-spacing:0.4px]">{label}</div>
      <div
        className={`stat-num [font-size:28px] [font-weight:800] [color:#1e293b] [margin:4px_0] ${valueColorMap[color] || "[color:#7c3aed]"}`}
      >
        {value}
      </div>
      <div className={`stat-icon [position:absolute] [top:18px] [right:18px] [width:42px] [height:42px] [border-radius:10px] [display:flex] [align-items:center] [justify-content:center] [font-size:18px] ${colorMap[color] || colorMap.brand}`}>
        {icon}
      </div>
    </div>
  );
}

export default StatCard;
