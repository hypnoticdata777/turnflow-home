import { requireRole } from "@/lib/auth/dal";
import { OwnerSidebar } from "@/components/OwnerSidebar";

export default async function OwnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireRole("owner");

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gray-100">
      <OwnerSidebar />
      <div className="flex-1 p-6">{children}</div>
    </div>
  );
}
