const MS_PER_DAY = 1000 * 60 * 60 * 24;
const CLOSING_SOON_THRESHOLD_DAYS = 14;

export function formatDate(dateString) {
  if (!dateString) return null;

  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function getJobStatusDetails(dueDateStr) {
  if (!dueDateStr) {
    return { label: "Active", badgeClass: "badge-green" };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dueDate = new Date(dueDateStr);
  dueDate.setHours(0, 0, 0, 0);

  const daysRemaining = Math.ceil(
    (dueDate.getTime() - today.getTime()) / MS_PER_DAY,
  );

  if (daysRemaining < 0) {
    return { label: "Overdue", badgeClass: "badge-red" };
  }

  if (daysRemaining <= CLOSING_SOON_THRESHOLD_DAYS) {
    return { label: "Closing Soon", badgeClass: "badge-yellow" };
  }

  return { label: "Active", badgeClass: "badge-green" };
}