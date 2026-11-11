---
title: Packing more databases into fewer Aurora clusters
company: TripAdvisor
year: "2023–now"
tag: Cloud · Infrastructure as Code · FinOps
summary: A single AWS CDK stack per cluster hit CloudFormation's 500-resource limit at around 10 databases. Splitting the deploy into stages raised that to 25-30 per cluster, and the fleet shrank from about 70 Aurora clusters to 28.
metric: −60% RDS cost
order: 2
highlights: ["Reduced the costs of RDS instances"]
---

## Context

The team ran **Aurora PostgreSQL** clusters in a dedicated AWS account, all provisioned with
AWS CDK. Each cluster was a single stack that carried everything: the cluster and its
configuration, the databases inside it, the users and their access, and the Lambda functions
that set it all up.

Aurora exposes one database per cluster in its metadata. To host more, a Lambda function
connected to the new cluster with admin credentials and created the extra databases directly
in PostgreSQL. It works well, but those databases don't show up in the RDS metadata, so
everything about them had to be declared in code.

## The problem: a ceiling on every cluster

Every database added to a cluster brought its own set of resources to the stack. A CDK stack
synthesizes to a single CloudFormation stack, and CloudFormation allows at most
**500 resources per stack**. In practice that capped each cluster at about **10 databases**.

More databases meant more clusters, each one billed for its instances whether it was full or
not. Cost Explorer made the trend easy to see: the account only held these databases, so the
RDS line was the whole story.

## The fix: deploy in stages

Instead of one stack per cluster, I split the deploy into several smaller stacks, each with a
single job:

1. **Cluster:** the Aurora cluster and its configuration.
2. **Users:** database users and their access.
3. **Databases:** the Lambda-backed step that connects to the cluster and creates the
   databases inside it.

No single stack carries the whole cluster anymore, so the 500-resource limit stopped dictating
how many databases a cluster could hold.

## Impact

- Each cluster went from about **10 databases to 25-30**.
- The fleet went from about **70 clusters to 28**, hosting the same workload. The two numbers
  agree: 70 clusters of 10 and 28 clusters of 25 both come to roughly 700 databases.
- RDS cost dropped by **60%**.
- The deploy became easier to reason about. Each stage has one responsibility, so a change to
  users doesn't touch the cluster definition.

## Takeaways

- **Infrastructure limits shape the bill.** A resource limit in the deploy tool was quietly
  deciding how many clusters the company paid for.
- **Split stacks by responsibility.** Smaller stacks with one job each scale further and are
  easier to change safely.
