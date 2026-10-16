export const USER_GUIDE_EVENT = "hireai-open-user-guide";

export function openUserGuide() {
  window.dispatchEvent(new Event(USER_GUIDE_EVENT));
}
