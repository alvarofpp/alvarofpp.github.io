---
title: Adversarial code review with a second model family
company: TripAdvisor
year: "2026"
tag: AI · Developer tooling · AWS Bedrock
summary: Code written with Claude Code gets reviewed by a model from a different family on AWS Bedrock. A second model catches what the first one let slip, so higher-quality code ships, and the review doesn't spend the developer's own AI quota.
metric: Cross-family AI review
order: 2
highlights: ["Developed a plugin, adopted by multiple teams"]
---

## Context

Every engineer at the company had access to Claude Code, and a growing share of the code was
being written with it. That raised two questions:

- **How do we review AI-written code well, and fast?** A model reviewing its own output tends
  to share its own blind spots.
- **Who pays for the review?** Each developer had a monthly quota. Using the same quota to
  write code and then to review it meant less room for actual development.

## The idea

Split the work between two model families:

- **Write locally** with Claude Code, as before.
- **Review remotely** with a model from another family, such as OpenAI's models available on
  AWS Bedrock.

This is an adversarial review: a second model, trained differently, reading the change with
fresh eyes and looking for what the first one let slip.

## How it works

The tool is a Claude Code plugin, published on the company's internal plugin marketplace, so
any team can install it and run a review without leaving the tool they write code in.

1. The plugin collects the changes to review, either local changes or the diff of a pull
   request, along with a short description of the project for context.
2. It sends that payload to an AWS Lambda function.
3. The Lambda prepares the input and calls a model on AWS Bedrock.
4. The model returns a verdict with findings: what was overlooked, what needs to change and why.

The review never touches the developer's quota: it runs on Bedrock, outside it.

## Impact

- **Higher-quality code.** Every change written with Claude Code can now be reviewed by a model
  from a different family, which catches what the first one let slip instead of sharing its
  blind spots.
- Developers spend their AI quota only on development; reviews no longer compete for it.
- Adopted by three teams in its first two months.
