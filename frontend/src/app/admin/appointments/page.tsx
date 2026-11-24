import { AppointmentsList } from "@/components/admin/appointments";

// This page loads its data in the browser through admin-only API calls, so there is no
// server-rendered content to validate.
export const instant = false;

export default function Page() {
  return <AppointmentsList />;
}
