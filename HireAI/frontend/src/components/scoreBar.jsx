function scoreBar(score) {
  const color =
    score > 70 ? "var(--green)" : score > 50 ? "var(--orange)" : "var(--red)";
  return (
    <div className="score-bar">
      <div
        className="score-bar-fill"
        style={{ width: `${score}%`, background: color }}
      />
      <span>{score}%</span>
    </div>
  );
}

export default scoreBar