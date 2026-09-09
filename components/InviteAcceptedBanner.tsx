export function InviteAcceptedBanner({ role }: { role: "vendor" | "collaborator" }) {
  return (
    <section className="mb-6 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-emerald-950 shadow-sm">
      <p className="text-sm font-semibold">Invite accepted</p>
      <p className="mt-1 text-sm leading-6">
        Your {role === "vendor" ? "assigned job" : "shared request"} is ready in this workspace.
      </p>
    </section>
  );
}
