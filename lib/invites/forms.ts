import { z } from "zod";

const inviteIdSchema = z.object({
  inviteId: z.string().uuid("Invite id is missing or invalid."),
});

const sharedAccessSchema = z.object({
  requestId: z.string().uuid("Request id is missing or invalid."),
  role: z.enum(["vendor", "collaborator"], {
    error: "Shared access role is missing or invalid.",
  }),
});

export function parseInviteIdFields(input: { inviteId: FormDataEntryValue | null }) {
  return inviteIdSchema.safeParse({ inviteId: input.inviteId });
}

export function inviteIdFromFormData(formData: FormData) {
  return parseInviteIdFields({ inviteId: formData.get("inviteId") });
}

export function parseSharedAccessFields(input: {
  requestId: FormDataEntryValue | null;
  role: FormDataEntryValue | null;
}) {
  return sharedAccessSchema.safeParse({
    requestId: input.requestId,
    role: input.role,
  });
}

export function sharedAccessFromFormData(formData: FormData) {
  return parseSharedAccessFields({
    requestId: formData.get("requestId"),
    role: formData.get("role"),
  });
}
