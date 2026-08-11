import { describe, expect, it } from "vitest";
import { commentThreadGuidance } from "@/lib/comment-guidance";

describe("commentThreadGuidance", () => {
  it("helps vendors ask for missing job context before work starts", () => {
    expect(
      commentThreadGuidance("vendor", {
        status: "Scheduled",
        location: "",
        accessInstructions: null,
        contactMethod: "Phone",
        photos: [],
        comments: [],
      })
    ).toMatchObject({
      eyebrow: "Owner handoff",
      title: "Ask for the missing job context before work starts.",
      detail:
        "This request is missing location and access instructions. Ask in the thread so the answer stays attached to the repair record.",
      emptyState: "No vendor/owner updates yet. Ask for the missing context here.",
      placeholder: "Ask the owner for the detail you need...",
      suggestions: [
        "Can you confirm the location and access instructions before I start?",
        "I can begin once the access details are clear.",
      ],
    });
  });

  it("guides vendors through closeout proof updates", () => {
    expect(
      commentThreadGuidance("vendor", {
        status: "In Progress",
        location: "Kitchen",
        accessInstructions: "Side gate",
        contactMethod: "Text",
        finalCost: null,
        photos: [{ type: "after" }],
        comments: [{}],
      })
    ).toMatchObject({
      eyebrow: "Closeout handoff",
      title: "Leave the owner a clean closeout update.",
      placeholder: "Tell the owner what changed or what is still needed...",
      suggestions: [
        "After-photo proof is uploaded for owner review.",
        "Final cost still needs owner or invoice confirmation.",
      ],
    });
  });

  it("points owners without helpers toward preserved repair notes", () => {
    expect(
      commentThreadGuidance("owner", {
        status: "Draft",
        comments: [],
      })
    ).toMatchObject({
      eyebrow: "Owner notes",
      title: "Keep repair context in the record.",
      emptyState: "No updates yet. Add the first note if there is context to preserve.",
      placeholder: "Add a repair note...",
    });
  });

  it("helps owners respond when shared work lacks context", () => {
    expect(
      commentThreadGuidance("owner", {
        status: "Scheduled",
        assignedVendorId: "vendor-1",
        location: "Bathroom",
        accessInstructions: "",
        contactMethod: "",
        comments: [],
      })
    ).toMatchObject({
      eyebrow: "Owner response",
      title: "Help the vendor move by filling the context gap.",
      detail:
        "This request is missing access instructions and preferred contact. Reply here after you add or confirm those details.",
      suggestions: [
        "I added the access instructions and preferred contact to the request.",
        "Please confirm if you need anything else before starting.",
      ],
    });
  });

  it("keeps collaborator updates scoped and useful", () => {
    expect(
      commentThreadGuidance("collaborator", {
        status: "Waiting",
        comments: [],
      })
    ).toMatchObject({
      eyebrow: "Shared update",
      title: "Add context only where it helps the owner decide.",
      placeholder: "Post a helpful update for the owner...",
    });
  });
});
