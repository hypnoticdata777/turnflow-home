import { redirect } from "next/navigation";
import { getSession, roleHome } from "@/lib/auth/dal";
import { db } from "@/lib/db";
import { AcceptInviteButton } from "@/components/AcceptInviteButton";

export default async function AcceptInvitePage({
  searchParams,
}: {
  searchParams: Promise<{ invite?: string }>;
}) {
  const { invite: inviteId } = await searchParams;
  const session = await getSession();

  // Unauthenticated: bounce to login, but remember where to come back to
  // (proxy.ts treats /accept-invite as a public route specifically so this
  // page — not proxy — controls the redirect and keeps the invite id).
  if (!session?.user) {
    const callbackUrl = `/accept-invite${inviteId ? `?invite=${inviteId}` : ""}`;
    redirect(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  }

  if (!inviteId) {
    return <Shell status="No invite was specified. Check the link and try again." />;
  }

  const invite = await db.query.invites.findFirst({
    where: (i, { eq }) => eq(i.id, inviteId),
  });

  if (!invite) {
    return <Shell status="This invite doesn't exist or is no longer valid." />;
  }
  if (invite.role !== session.user.role) {
    return (
      <Shell
        status={`This invite is for a ${invite.role} account. You're signed in as a ${session.user.role} — sign out and sign in with the right account to accept it.`}
      />
    );
  }
  if (invite.status !== "pending") {
    return <Shell status="This invite has already been used or is no longer valid." />;
  }
  if (invite.expiresAt < new Date()) {
    return <Shell status="This invite has expired. Ask the property owner to send a new one." />;
  }
  if (invite.email !== (session.user.email || "").toLowerCase()) {
    return (
      <Shell
        status={`This invite was sent to ${invite.email}. Sign out and sign in with that address to accept it.`}
      />
    );
  }
  if (!invite.requestId) {
    return <Shell status="This invite is missing its request." />;
  }

  const req = await db.query.requests.findFirst({
    where: (r, { eq }) => eq(r.id, invite.requestId!),
  });
  if (!req) {
    return <Shell status="The request this invite is for could not be found." />;
  }

  return (
    <Shell status={`You've been invited to work on this request as a ${invite.role}:`}>
      <div className="text-sm text-gray-700 space-y-1 mb-4">
        <p>
          <strong>Title:</strong> {req.title}
        </p>
        <p>
          <strong>Category:</strong> {req.category}
        </p>
        <p>
          <strong>Location:</strong> {req.location || "—"}
        </p>
      </div>
      <AcceptInviteButton inviteId={inviteId} redirectTo={roleHome(invite.role)} />
    </Shell>
  );
}

function Shell({ status, children }: { status: string; children?: React.ReactNode }) {
  return (
    <div className="min-h-screen grid place-items-center bg-gray-50">
      <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold">🤝 Accept Invite</h1>
          <p className="text-gray-500">TurnFlow Home</p>
        </div>
        <p className="text-sm text-gray-700 mb-4">{status}</p>
        {children}
      </div>
    </div>
  );
}
