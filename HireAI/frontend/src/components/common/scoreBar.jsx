function scoreBar(score) {
  const color =
    score > 70
      ? "[background:#22c55e]"
      : score > 50
        ? "[background:#f59e0b]"
        : "[background:#ef4444]";
  return (
    <div className="score-bar [display:flex] [align-items:center] [gap:8px]">
      <div
        className={`score-bar-fill [height:6px] [background:#133f7d] [border-radius:3px] [min-width:0] ${color}`}
        style={{ width: `${score}%` }}
      />
      <span className="[.score-bar_&]:[font-size:12px] [.score-bar_&]:[font-weight:700] [.score-bar_&]:[color:#1e293b]">{score}%</span>
    </div>
  );
}

export default scoreBar;
