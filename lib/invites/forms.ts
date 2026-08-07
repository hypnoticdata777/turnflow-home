import { z } from "zod";

const inviteIdSchema = z.object({
  inviteId: z.string().uuid("Invite id is missing or invalid."),
});

export function parseInviteIdFields(input: { inviteId: FormDataEntryValue | null }) {
  return inviteIdSchema.safeParse({ inviteId: input.inviteId });
}

export function inviteIdFromFormData(formData: FormData) {
  return parseInviteIdFields({ inviteId: formData.get("inviteId") });
}
