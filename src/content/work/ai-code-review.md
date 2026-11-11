---
title: An AI reviewer on every merge request
company: TripAdvisor
year: "2023–now"
tag: AI · Developer tooling · Kubernetes
summary: An agent running on Kubernetes reviews every merge request opened across the company's GitLab, line by line, approves or rejects it, and leaves inline suggestions that it checks again on every update.
metric: 100+ MRs / day
order: 1
highlights: ["Built an AI bot"]
---

## Context

The goal: every merge request opened across the company's GitLab gets a review. At hundreds of
merge requests a day, that has to be automated.

## How it works

1. **Event.** When a merge request is opened, a GitLab system hook catches the event and
   triggers the review.
2. **Agent.** An agent running on Kubernetes picks up the merge request and reviews it line by
   line, applying several different review approaches to the same change.
3. **Verdict.** It ends with a clear outcome: the merge request is approved or rejected.
4. **Inline feedback.** When a change doesn't pass, the agent comments inline, on the file and
   line in question: what is wrong, why, and a suggested fix.
5. **Follow-up.** Every time the merge request is updated, the agent reviews it again, checking
   whether the earlier findings were fixed and whether the update introduced new problems.

## Impact

- Hundreds of merge requests reviewed every day.
- Every change gets concrete, line-level suggestions instead of a generic summary, and the
  agent keeps checking them until they are fixed.
- More reliable code reaching production.
