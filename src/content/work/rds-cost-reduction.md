---
title: Packing more databases into fewer Aurora clusters
company: TripAdvisor
year: "2025–2026"
tag: Cloud · Infrastructure as Code · FinOps
summary: A single AWS CDK stack per cluster hit CloudFormation's 500-resource limit at around 10 databases. Splitting the deploy into stages removed that ceiling, and the fleet shrank from about 65 Aurora clusters to 26.
metric: −60% RDS cost
order: 2
highlights: ["Reduced the costs of RDS instances"]
---

## Context

The team ran **Aurora PostgreSQL** clusters in a dedicated AWS account, all provisioned with
AWS CDK. A single stack handled everything related to a cluster: the cluster and its
configuration, the databases inside it, the users and their access, and the Lambda functions
that set it all up.

Aurora exposes one database per cluster in its metadata. To host more, a Lambda function
connected to the new cluster with admin credentials and created the extra databases directly
in PostgreSQL. It works well, but those databases don't show up in the RDS metadata, so
everything about them had to be declared in code.

## The problem: a ceiling on every cluster

Every database added to a cluster brought its own set of resources to the stack. A CDK stack
synthesizes to a single CloudFormation stack, and CloudFormation allows at most
**500 resources per stack**. In practice that capped each cluster at about **10 databases**,
no matter how small they were.

More databases meant more clusters, each one billed for its instances whether it was full or
not. Cost Explorer made the trend easy to see: the account only held these databases, so the
RDS line was the whole story.

## The fix: deploy in stages

Instead of one stack per cluster, I split the deploy into several smaller stacks, each with a
single job:

1. **Cluster:** provision the Aurora cluster and its configuration.
2. **Secrets and users:** create the credentials and database users.
3. **Configuration:** the Lambda connects to the cluster and configures it based on the
   resources from the previous stages, creating the databases inside it.
4. **Network:** grant the network access and permissions each consumer needs.

No single stack carries the whole cluster anymore, so the 500-resource limit stopped dictating
how many databases a cluster could hold. The new ceiling was 25-30 databases per cluster.

## Packing with judgment

The point was not to fill every cluster to the limit. How many databases went into a cluster
depended on their size:

- **Large databases** kept a cluster to themselves, or shared it with one or two others.
- **Small databases** could be grouped, around 20 to a cluster.
- **Every cluster kept headroom** for maintenance and for new databases in the future.

## Impact

- The fleet went from about **65 clusters to 26**.
- RDS cost dropped by **60%**.
- The deploy became easier to reason about. Each stage has one responsibility, so a change to
  users or network access doesn't touch the cluster definition.

## Takeaways

- **Infrastructure limits shape the bill.** A resource limit in the deploy tool was quietly
  deciding how many clusters the company paid for.
- **Split stacks by responsibility.** Smaller stacks with one job each scale further and are
  easier to change safely.
