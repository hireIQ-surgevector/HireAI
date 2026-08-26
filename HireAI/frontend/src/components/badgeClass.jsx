function badgeClass(status) {
  return status === "active"
    ? "badge-blue"
    : status === "offered"
      ? "badge-orange"
      : "badge-red";
}

export default badgeClass;
