import type { NotificationItem } from "@/features/notifications/types";

function hoursAgo(hours: number): string {
  return new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
}

function daysAgo(days: number): string {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

/** Mock inbox for dropdown demo (visual parity with employee-style notifications). */
export const mockNotifications: NotificationItem[] = [
  {
    id: "n-1",
    title: "New Skill Added",
    description:
      '"Advanced Engine Diagnostics" has been added to your skill.',
    category: "updates",
    createdAt: hoursAgo(0.05),
    read: false,
  },
  {
    id: "n-2",
    title: "Employer Invitation",
    description: "ABC Motors has invited you to join their organisation.",
    category: "reminders",
    createdAt: hoursAgo(0.75),
    read: false,
  },
  {
    id: "n-3",
    title: "Certificate Approved",
    description:
      "Your 'Basic Mechanic Training' certificate has been approved.",
    category: "celebration",
    createdAt: daysAgo(1),
    read: false,
  },
  {
    id: "n-4",
    title: "Profile Update Reminder",
    description: "Add your employment history to complete your profile.",
    category: "reminders",
    createdAt: daysAgo(1.2),
    read: true,
  },
  {
    id: "n-5",
    title: "Verification Status Updated",
    description:
      "Your profile verification is in progress. We'll notify you once it's complete.",
    category: "updates",
    createdAt: daysAgo(10),
    read: true,
  },
  {
    id: "n-6",
    title: "New Score Rules Live",
    description: "We've refreshed the FADA score rulebook. See what changed.",
    category: "announcement",
    createdAt: daysAgo(2),
    read: false,
  },
  {
    id: "n-7",
    title: "Q3 Company Summit",
    description: "Join the FADA Company Summit in Delhi. RSVP now.",
    category: "announcement",
    createdAt: daysAgo(5),
    read: false,
  },
];
