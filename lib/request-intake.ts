export type RequestIntakeInput = {
  propertyId: string;
  title: string;
  category: string;
  urgency: string;
  location: string;
  contactMethod: string;
  accessInstructions: string;
  notes: string;
  photoCount: number;
};

export type RequestIntakeStep = {
  label: string;
  detail: string;
  complete: boolean;
  href: string;
  cta: string;
};

export type RequestIntakeSummary = {
  headline: string;
  detail: string;
  tone: "empty" | "progress" | "ready";
};

export type RequestIntakeHandoffCheck = {
  label: string;
  detail: string;
  complete: boolean;
};

export type RequestIntakeHandoffSummary = {
  headline: string;
  detail: string;
  tone: "empty" | "progress" | "ready";
};

function hasText(value: string) {
  return value.trim().length > 0;
}

export function requestIntakeSteps(input: RequestIntakeInput): RequestIntakeStep[] {
  return [
    {
      label: "Property",
      detail: "Connect the request to the home record.",
      complete: hasText(input.propertyId),
      href: "#request-property",
      cta: "Choose property",
    },
    {
      label: "Short title",
      detail: "Name the problem so it is easy to scan later.",
      complete: hasText(input.title),
      href: "#request-title",
      cta: "Add title",
    },
    {
      label: "Category",
      detail: "Get the right homeowner checklist and repair context.",
      complete: hasText(input.category),
      href: "#request-category",
      cta: "Choose category",
    },
    {
      label: "Urgency",
      detail: "Separate routine work from anything time-sensitive.",
      complete: hasText(input.urgency),
      href: "#request-urgency",
      cta: "Set urgency",
    },
    {
      label: "Initial proof",
      detail: "A photo or receipt reduces back-and-forth after submission.",
      complete: input.photoCount > 0,
      href: "#request-photos",
      cta: "Attach proof",
    },
  ];
}

export function requestIntakeProgress(steps: RequestIntakeStep[]) {
  const completedCount = steps.filter((step) => step.complete).length;
  const totalCount = steps.length;
  const progress = totalCount ? Math.round((completedCount / totalCount) * 100) : 0;
  return { completedCount, totalCount, progress };
}

export function requestIntakeNextStep(steps: RequestIntakeStep[]) {
  return steps.find((step) => !step.complete) ?? null;
}

export function requestIntakeSummary(steps: RequestIntakeStep[]): RequestIntakeSummary {
  const { completedCount, totalCount } = requestIntakeProgress(steps);
  const nextStep = requestIntakeNextStep(steps);

  if (completedCount === 0 && nextStep) {
    return {
      headline: "Start by choosing the home.",
      detail:
        "Once the request is tied to a property, the rest of the repair record has a clear place to live.",
      tone: "empty",
    };
  }

  if (!nextStep) {
    return {
      headline: "This request has enough context to start strong.",
      detail:
        "The owner, helper, or vendor will have the basic context they need before the first follow-up.",
      tone: "ready",
    };
  }

  return {
    headline: `${completedCount} of ${totalCount} request details are ready.`,
    detail: `Next best action: ${nextStep.cta.toLowerCase()} so this repair record is easier to act on.`,
    tone: "progress",
  };
}

export function requestIntakeHandoffChecks(
  input: RequestIntakeInput
): RequestIntakeHandoffCheck[] {
  return [
    {
      label: "Exact location",
      detail: "Room or area saves a follow-up before anyone visits the home.",
      complete: hasText(input.location),
    },
    {
      label: "Contact path",
      detail: "A preferred channel keeps owner/vendor coordination out of guesswork.",
      complete: hasText(input.contactMethod),
    },
    {
      label: "Access context",
      detail: "Gate, pets, lockbox, parking, or timing notes prevent day-of delays.",
      complete: hasText(input.accessInstructions),
    },
    {
      label: "Issue history",
      detail: "Notes about when it started or what changed make quotes cleaner.",
      complete: hasText(input.notes),
    },
  ];
}

export function requestIntakeHandoffSummary(
  checks: RequestIntakeHandoffCheck[]
): RequestIntakeHandoffSummary {
  const completeCount = checks.filter((check) => check.complete).length;

  if (completeCount === 0) {
    return {
      headline: "Vendor handoff is still light.",
      detail:
        "You can save the draft with the required fields, but adding context now reduces back-and-forth later.",
      tone: "empty",
    };
  }

  if (completeCount === checks.length) {
    return {
      headline: "Vendor handoff looks ready.",
      detail:
        "This request has the practical details a helper or vendor usually needs before bidding or visiting.",
      tone: "ready",
    };
  }

  return {
    headline: `${completeCount} of ${checks.length} handoff details are ready.`,
    detail:
      "The draft can be saved now. Add the missing details when you want a smoother quote or site visit.",
    tone: "progress",
  };
}
