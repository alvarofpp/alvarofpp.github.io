---
title: An AI reviewer on every merge request
company: TripAdvisor
year: "2026"
tag: AI · Developer tooling · Kubernetes
summary: An agent on Kubernetes reviews every non-draft merge request in scope. It posts inline findings with suggested fixes, checks them again on each push, and approves once nothing actionable is left.
metric: 100+ MRs / day
order: 1
highlights: ["Built an AI bot"]
---

## Context

Every merge request should get a review, in every repository, without teams having to set
anything up. At 100+ merge requests a day, that has to be automated.

Paid-tier GitLab features such as group webhooks and pipeline execution policies weren't
available, so the only way to see every merge request on the instance was a **system hook**. The
rest of the design is built around it.

## Architecture

<figure class="figure">
<div class="figure-scroll">
<svg class="diagram" viewBox="0 0 900 400" role="img" aria-label="A merge request event goes from the GitLab system hook to a dispatcher on Kubernetes, which triggers a review pipeline. The pipeline runs gates in a shell, then Claude Code against AWS Bedrock with no token, then a publisher script that posts findings, the verdict and the approval back on the merge request.">
  <defs>
    <marker id="ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="var(--ink-soft)"/></marker>
  </defs>
  <rect x="20" y="20" width="200" height="360" fill="var(--bg-alt)" stroke="var(--line)"/>
  <text x="36" y="46" class="lane">GitLab</text>
  <rect x="36" y="64" width="168" height="60" fill="#fff" stroke="var(--line)"/>
  <text x="48" y="88" class="title">Merge request</text>
  <text x="48" y="108" class="sub">opened, reopened, pushed</text>
  <rect x="36" y="150" width="168" height="60" fill="#fff" stroke="var(--line)"/>
  <text x="48" y="174" class="title">System hook</text>
  <text x="48" y="194" class="sub">MR events, instance-wide</text>
  <rect x="36" y="282" width="168" height="78" fill="#fff" stroke="var(--accent)" stroke-width="2"/>
  <text x="48" y="306" class="title">Back on the MR</text>
  <text x="48" y="326" class="sub">inline findings, nits,</text>
  <text x="48" y="342" class="sub">verdict, resolve, approve</text>
  <line x1="120" y1="124" x2="120" y2="148" stroke="var(--ink-soft)" stroke-width="1.5" marker-end="url(#ah)"/>

  <rect x="270" y="20" width="200" height="190" fill="var(--bg-alt)" stroke="var(--line)"/>
  <text x="286" y="46" class="lane">Kubernetes</text>
  <rect x="286" y="64" width="168" height="130" fill="#fff" stroke="var(--line)"/>
  <text x="298" y="88" class="title">Dispatcher</text>
  <text x="298" y="110" class="sub">Python stdlib, 3 replicas</text>
  <text x="298" y="130" class="sub">checks the shared secret</text>
  <text x="298" y="150" class="sub">filters action, state, path</text>
  <text x="298" y="170" class="sub">exports a /metrics counter</text>
  <path d="M204,180 L286,130" fill="none" stroke="var(--ink-soft)" stroke-width="1.5" marker-end="url(#ah)"/>

  <rect x="520" y="20" width="360" height="360" fill="var(--bg-alt)" stroke="var(--line)"/>
  <text x="536" y="46" class="lane">Review pipeline (CI job)</text>
  <path d="M454,104 L534,104" fill="none" stroke="var(--ink-soft)" stroke-width="1.5" marker-end="url(#ah)"/>
  <text x="462" y="94" class="edge">trigger API</text>
  <rect x="536" y="64" width="328" height="60" fill="#fff" stroke="var(--line)"/>
  <text x="548" y="88" class="title">1 · Gates and setup</text>
  <text x="548" y="108" class="sub">shell, holds the token: state, draft, clone, context</text>
  <rect x="536" y="142" width="328" height="76" fill="#fff" stroke="var(--accent)" stroke-width="2"/>
  <text x="548" y="166" class="title">2 · Claude Code, headless</text>
  <text x="548" y="186" class="sub">no token; up to 3 specialist subagents</text>
  <text x="548" y="204" class="sub">writes a single review.json</text>
  <rect x="536" y="236" width="328" height="60" fill="#fff" stroke="var(--line)"/>
  <text x="548" y="260" class="title">3 · Publisher</text>
  <text x="548" y="280" class="sub">shell, holds the token: posts and approves</text>
  <rect x="536" y="314" width="328" height="50" fill="#fff" stroke="var(--line)"/>
  <text x="548" y="336" class="title">4 · Outcome</text>
  <text x="548" y="354" class="sub">finished, failed or canceled, on the MR</text>
  <line x1="700" y1="124" x2="700" y2="140" stroke="var(--ink-soft)" stroke-width="1.5" marker-end="url(#ah)"/>
  <line x1="700" y1="218" x2="700" y2="234" stroke="var(--ink-soft)" stroke-width="1.5" marker-end="url(#ah)"/>
  <line x1="700" y1="296" x2="700" y2="312" stroke="var(--ink-soft)" stroke-width="1.5" marker-end="url(#ah)"/>

  <rect x="270" y="236" width="200" height="70" fill="var(--bg-alt)" stroke="var(--line)"/>
  <text x="286" y="262" class="lane">AWS Bedrock</text>
  <text x="286" y="284" class="sub">Claude, via the pod's IAM role</text>
  <path d="M536,180 L472,262" fill="none" stroke="var(--accent)" stroke-width="1.5" stroke-dasharray="4 3" marker-end="url(#ah)"/>
  <path d="M536,266 C420,340 320,330 206,322" fill="none" stroke="var(--accent)" stroke-width="1.5" marker-end="url(#ah)"/>
  <text x="300" y="352" class="edge accent">GitLab REST API</text>
</svg>
</div>
<figcaption>The GitLab token is removed from the model's environment. Shell steps before and after the model handle all GitLab calls.</figcaption>
</figure>

- **The dispatcher**, a small service on Kubernetes, receives every merge request event, checks
  whether the repository is in scope, and starts a pipeline.
- **The review job** clones the change, runs Claude Code headless, and turns its output into
  GitLab API calls.
- **The model** reviews and writes one JSON document. It never posts anything itself.

A repository adds **zero files** to be reviewed, and there are **no model API keys**: Bedrock is
reached through the job pod's IAM role.

## One review, step by step

<ol class="steps">
  <li><span class="where w-dp">Dispatcher</span><b>Filter and trigger.</b> The system hook delivers each merge request event with a shared secret. In-scope, open merge requests start a review pipeline.</li>
  <li><span class="where w-job">Job</span><b>Gate.</b> The job reads the merge request again and exits if it is closed, a draft, or this commit already has a verdict, so editing a title or label doesn't trigger another review.</li>
  <li><span class="where w-job">Job</span><b>Prepare.</b> It clones exactly the merge request head, strips the token, and loads the reviewer prompt from the default branch, so a merge request can't rewrite its own reviewer.</li>
  <li><span class="where w-ai">Model</span><b>Review.</b> Claude Code runs without the token and, on a full review, routes files to the repository's specialist agents (up to three in parallel), then writes its findings.</li>
  <li><span class="where w-job">Job</span><b>Publish.</b> If a newer push landed meanwhile, the run is discarded. Otherwise it withdraws the old approval, resolves fixed threads, posts findings on their lines, posts the verdict last, and approves only if nothing was raised.</li>
</ol>

## How it reviews

The first review of a merge request reads the whole diff. Every later push runs in **check mode**
(unless history was rewritten, which gets a full review again): each earlier finding is marked resolved, partial or not addressed, quoting the current line, and
the new commits are checked for regressions.

The reviewer also runs code. It tries changed functions on tricky inputs, greps every path and config
key the diff cites, and treats a removed guard as a regression until shown otherwise. It only calls
something "verified" if it actually ran it.

<div class="mr-note">
  <div class="mr-head"><span class="avatar"></span><b>AI review bot</b> · comment</div>
  <div class="mr-body">
    <p><b>AI review</b></p>
    <p>Address the two actionable findings before merging; the rest is optional.</p>
    <ul>
      <li>Actionable findings: 2 (in 2 files)</li>
      <li>Nits: 3 · Escalations: 0</li>
      <li>Executed: <code>parse_config()</code> on an empty file and a nested block → nested keys dropped</li>
    </ul>
    <p class="mr-sentinel">&lt;!-- ai-review:verdict sha=1a2b3c4d… --&gt;</p>
  </div>
</div>

Each actionable finding gets its own inline thread, with a one-click suggested fix when the fix is
a line replacement. Nits go into a single note, and design questions it can't settle are escalated
to a human in a separate one. Every run that doesn't approve withdraws the previous approval, so a vote on an old
commit never covers new code.

## Built to not lose reviews

A missing review goes unnoticed, so the design focuses on never losing one:

- One verdict per commit, posted last, so a failed run leaves the commit eligible again.
- Retries are safe because reviewing is read-only.
- Three dispatcher replicas, since GitLab never retries a hook delivery.
- An outcome counter on `/metrics`, so "no reviews" can be told apart from "no data".

## Impact

- 100+ merge requests reviewed every day, with nothing installed in the repositories.
- Line-level findings instead of a generic summary, checked again on every push until fixed.
- Approvals that always refer to the code being merged, never to an older commit.
