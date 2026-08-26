function StepDot({ label, current, index }) {
  const status =
    index < current ? "done" : index === current ? "active" : "pending";
  return (
    <div className="step-dot-wrap">
      <div className={`step-dot ${status}`}>
        {index < current ? "✓" : index + 1}
      </div>
      <span>{label}</span>
    </div>
  );
}

export default StepDot;
