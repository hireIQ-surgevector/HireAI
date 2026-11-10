function badgeClass(status) {
  const normalizedStatus = (status || "").trim().toLowerCase();

  if (["offered", "offer sent"].includes(normalizedStatus)) {
    return "[background:#fef3c7] [color:#92400e]";
  }
  if (["rejected", "declined"].includes(normalizedStatus)) {
    return "[background:#fee2e2] [color:#991b1b]";
  }
  if (["onboarded", "active", "shortlisted"].includes(normalizedStatus)) {
    return "[background:#dcfce7] [color:#166534]";
  }
  if (normalizedStatus.includes("interview")) {
    return "[background:#e8f0fb] [color:#133f7d]";
  }
  return "[background:#f1f5f9] [color:#475569]";
}

export default badgeClass;
