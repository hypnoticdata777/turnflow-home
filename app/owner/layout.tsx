import { Suspense } from "react";
import { requireRole } from "@/lib/auth/dal";
import { OwnerSidebar } from "@/components/OwnerSidebar";

export default async function OwnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireRole("owner");

  return (
    <div className="flex min-h-screen flex-col bg-gray-100 md:flex-row">
      <Suspense
        fallback={
          <div className="h-20 border-b bg-white md:h-auto md:w-64 md:border-r" />
        }
      >
        <OwnerSidebar />
      </Suspense>
      <div className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</div>
    </div>
  );
}
