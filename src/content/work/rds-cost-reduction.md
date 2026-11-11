---
title: Packing more databases into fewer Aurora clusters
company: TripAdvisor
year: "2025–2026"
tag: Cloud · Infrastructure as Code · FinOps
summary: A single AWS CDK stack per cluster hit CloudFormation's 500-resource limit at around 10 databases. Splitting the deploy into stages pushed that ceiling to 25-30 databases per cluster, and the fleet shrank from more than 60 Aurora clusters to 26.
metric: −60% RDS cost
order: 2
highlights: ["Reduced the costs of RDS instances"]
---

## Context

The team ran Aurora PostgreSQL clusters in a dedicated AWS account, all provisioned with AWS
CDK, with data flowing in from PostgreSQL databases on-premises. A single stack handled
everything related to a cluster: the cluster and its configuration, the databases inside it,
the users and their access, and the Lambda function that set it all up.

RDS metadata only records the one database created with the cluster. Any others have to be
created over a SQL connection, so a Lambda function connected to the cluster with admin
credentials and created them. Those extra databases don't appear in the RDS metadata.

## The problem: a ceiling on every cluster

Every database added to a cluster brought its own set of resources to the stack. A CDK stack
synthesizes to a single CloudFormation stack, and CloudFormation allows at most 500 resources
per stack. In practice that capped each cluster at about 10 databases, no matter how small
they were.

More databases meant more clusters, each one billed for its instances whether it was full or
not. Cost Explorer was enough to diagnose it: the account only held these clusters, so the RDS
line was the whole cost.

## The fix: deploy in stages

Instead of one stack per cluster, I split the deploy into several smaller stacks, each with a
single job:

1. **Cluster:** provision the Aurora cluster and its configuration.
2. **Secrets and users:** create the credentials and database users.
3. **Configuration:** the Lambda function connects to the cluster and configures it based on
   the resources from the previous stages, creating the databases inside it.
4. **Network:** set up the network permissions.
5. **Others:** supporting resources such as AWS DMS endpoints and replication tasks, which
   feed each database with its data from the on-premises PostgreSQL.

No single stack holds the whole cluster anymore, so the ceiling rose from about 10 databases
per cluster to 25-30.

## How many per cluster

It depended on size:

- Large databases kept a cluster to themselves, or shared it with one or two others.
- Small databases could be grouped, around 20 to a cluster.
- Every cluster kept headroom for maintenance and for new databases in the future.

## Impact

- The fleet went from more than 60 clusters to **26**.
- RDS cost dropped by **60%**.
- The deploy is organized by stages, each with one responsibility, so a change to users or
  network access doesn't touch the cluster definition.

## Takeaway

A per-stack resource limit in the deploy tool was setting how many clusters the company paid
for. Restructuring the deploy, not resizing instances, is what brought the bill down.
