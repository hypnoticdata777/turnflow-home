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

  // Unauthenticated visitors are sent to login, but the invite id is kept so
  // the acceptance flow can resume after sign-in.
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
    return <Shell status="This invite does not exist or is no longer valid." />;
  }
  if (invite.role !== session.user.role) {
    return (
      <Shell
        status={`This invite is for a ${invite.role} account. You are signed in as a ${session.user.role}. Sign out and sign in with the right account to accept it.`}
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
    <Shell status={`You have been invited to work on this request as a ${invite.role}.`}>
      <dl className="mb-4 space-y-2 text-sm text-gray-700">
        <div>
          <dt className="font-semibold">Title</dt>
          <dd>{req.title}</dd>
        </div>
        <div>
          <dt className="font-semibold">Category</dt>
          <dd>{req.category}</dd>
        </div>
        <div>
          <dt className="font-semibold">Location</dt>
          <dd>{req.location || "Not recorded"}</dd>
        </div>
      </dl>
      <AcceptInviteButton inviteId={inviteId} redirectTo={roleHome(invite.role)} />
    </Shell>
  );
}

function Shell({ status, children }: { status: string; children?: React.ReactNode }) {
  return (
    <main className="grid min-h-screen place-items-center bg-[#f6f7f4] px-4 py-8">
      <section className="w-full max-w-md rounded-lg border border-gray-200 bg-white p-8 shadow-sm">
        <div className="mb-6">
          <p className="text-sm font-semibold text-emerald-800">TurnFlow Home</p>
          <h1 className="mt-2 text-2xl font-bold">Accept invite</h1>
          <p className="mt-2 text-sm leading-6 text-gray-600">
            Confirm the shared maintenance request before it appears in your
            scoped workspace.
          </p>
        </div>
        <p className="mb-4 text-sm text-gray-700">{status}</p>
        {children}
      </section>
    </main>
  );
}
