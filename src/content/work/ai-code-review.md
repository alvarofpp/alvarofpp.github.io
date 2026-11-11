---
title: AI code review at company scale
company: TripAdvisor
year: "2023–now"
tag: AI · Developer tooling
summary: A bot that reviews hundreds of merge requests a day, plus an AWS Bedrock plugin adopted by multiple teams.
metric: 100s of MRs / day
order: 1
---

## Context

Code review is one of the slowest loops in software delivery. Across TripAdvisor's GitLab,
hundreds of merge requests are opened every day, and human reviewers can't give each one the
same depth of attention.

## What I built

- **An AI review bot** that automatically reviews merge requests across the company's GitLab,
  flagging issues before a human reviewer gets to them.
- **An AWS Bedrock–based plugin** that reviews MRs and PRs without consuming developers'
  personal AI quotas — so teams could adopt AI review without changing their budgets.

## Impact

- Hundreds of merge requests reviewed every day.
- The plugin was adopted by multiple teams.
- More reliable code reaching production, with LLMs brought into the everyday development workflow.
