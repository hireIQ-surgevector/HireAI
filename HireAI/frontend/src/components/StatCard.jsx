function StatCard({ label, value, icon, color }) {
  const colorMap = {
    brand: "var(--brand-light)",
    purple: "#ede9fe",
    teal: "#e0f7fa",
    orange: "#fef3c7",
    green: "#dcfce7",
  };
  return (
    <div className="stat-card">
      <div className="stat-label">{label}</div>
      <div
        className="stat-num"
        style={{
          color:
            color === "brand"
              ? "var(--brand)"
              : color === "green"
                ? "var(--green)"
                : color === "orange"
                  ? "var(--orange)"
                  : color === "teal"
                    ? "var(--teal)"
                    : "#7c3aed",
        }}
      >
        {value}
      </div>
      <div className="stat-icon" style={{ background: colorMap[color] }}>
        {icon}
      </div>
    </div>
  );
}

export default StatCard;
