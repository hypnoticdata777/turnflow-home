import { requireRole } from "@/lib/auth/dal";
import { BackupManager } from "@/components/BackupManager";

export default async function BackupPage() {
  await requireRole("owner");

  return (
    <main>
      <BackupManager />
    </main>
  );
}
