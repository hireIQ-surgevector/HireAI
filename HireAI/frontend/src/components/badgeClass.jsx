function badgeClass(status) {
  return status === "active"
    ? "[background:#e8f0fb] [color:#133f7d]"
    : status === "offered"
      ? "[background:#fef3c7] [color:#92400e]"
      : "[background:#fee2e2] [color:#991b1b]";
}

export default badgeClass;
