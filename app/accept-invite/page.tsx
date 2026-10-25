import { redirect } from "next/navigation";
import { getSession, roleHome } from "@/lib/auth/dal";
import { db } from "@/lib/db";
import { AcceptInviteButton } from "@/components/AcceptInviteButton";
import { InviteSignupForm } from "@/components/InviteSignupForm";
import {
  INVITE_PROBLEM_MESSAGES,
  inviteAccountMismatch,
  inviteRoleLabel,
  inviteValidityProblem,
  signedOutInviteEntry,
} from "@/lib/invites/claim";

export default async function AcceptInvitePage({
  searchParams,
}: {
  searchParams: Promise<{ invite?: string }>;
}) {
  const { invite: inviteId } = await searchParams;
  const session = await getSession();
  const callbackUrl = `/accept-invite${inviteId ? `?invite=${encodeURIComponent(inviteId)}` : ""}`;
  const loginHref = `/login?callbackUrl=${encodeURIComponent(callbackUrl)}`;

  if (!inviteId) {
    if (!session?.user) redirect(loginHref);
    return <Shell status="No invite was specified. Check the link and try again." />;
  }

  const invite = await db.query.invites.findFirst({
    where: (i, { eq }) => eq(i.id, inviteId),
  });

  // F4 (2026-10-25): signed-out visitors no longer always bounce to login.
  // With a valid invite and no account for the invited email, they create
  // their vendor/helper account right here; with an account, they log in and
  // the invite auto-claims afterwards (the original flow).
  if (!session?.user) {
    const accountExists = invite
      ? Boolean(
          await db.query.users.findFirst({
            where: (u, { eq }) => eq(u.email, invite.email),
            columns: { id: true },
          })
        )
      : false;
    const entry = signedOutInviteEntry(invite, accountExists);

    if (entry.kind === "login") redirect(loginHref);
    if (entry.kind === "invalid" || !invite) {
      return (
        <Shell status={entry.kind === "invalid" ? entry.message : INVITE_PROBLEM_MESSAGES.missing} />
      );
    }

    const request = invite.requestId
      ? await db.query.requests.findFirst({
          where: (r, { eq }) => eq(r.id, invite.requestId!),
          columns: { title: true },
        })
      : null;
    const roleLabel = inviteRoleLabel(invite.role);

    return (
      <Shell
        status={`You've been invited as a ${roleLabel}${
          request ? ` on "${request.title}"` : ""
        }. Create your account to open it.`}
      >
        <InviteSignupForm
          inviteId={inviteId}
          email={invite.email}
          roleLabel={roleLabel}
          loginHref={loginHref}
        />
      </Shell>
    );
  }

  const problem = inviteValidityProblem(invite);
  if (problem || !invite) {
    return <Shell status={INVITE_PROBLEM_MESSAGES[problem ?? "missing"]} />;
  }
  const mismatch = inviteAccountMismatch(invite, session.user);
  if (mismatch) {
    return <Shell status={mismatch} />;
  }

  const req = await db.query.requests.findFirst({
    where: (r, { eq }) => eq(r.id, invite.requestId!),
  });
  if (!req) {
    return <Shell status="The request this invite is for could not be found." />;
  }

  const destination = `${roleHome(invite.role)}?accepted=1`;

  return (
    <Shell status={`Opening your ${invite.role} workspace for "${req.title}"...`}>
      <dl className="mt-4 space-y-2">
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
          <dt className="text-xs font-semibold text-gray-500">Request</dt>
          <dd className="mt-1 text-sm font-semibold text-gray-950">{req.title}</dd>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
            <dt className="text-xs font-semibold text-gray-500">Category</dt>
            <dd className="mt-1 text-sm font-semibold text-gray-950">{req.category}</dd>
          </div>
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
            <dt className="text-xs font-semibold text-gray-500">Location</dt>
            <dd className="mt-1 text-sm font-semibold text-gray-950">
              {req.location || "Not recorded"}
            </dd>
          </div>
        </div>
      </dl>

      <div className="mt-5">
        <AcceptInviteButton inviteId={inviteId} redirectTo={destination} autoAccept />
      </div>
    </Shell>
  );
}

function Shell({ status, children }: { status: string; children?: React.ReactNode }) {
  return (
    <main className="grid min-h-screen place-items-center bg-slate-100 px-4 py-8">
      <section className="w-full max-w-md overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="bg-slate-950 p-6 text-white">
          <p className="text-sm font-semibold text-emerald-300">TurnFlow Home</p>
          <h1 className="mt-2 text-2xl font-bold">Accept invite</h1>
          <p className="mt-2 text-sm leading-6 text-slate-200">
            One scoped request is being added to your workspace.
          </p>
        </div>
        <div className="p-6">
          <p className="text-sm leading-6 text-slate-700">{status}</p>
          {children}
        </div>
      </section>
    </main>
  );
}
