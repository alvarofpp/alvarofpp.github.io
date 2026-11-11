---
title: Taming Airflow metric cardinality
company: Méliuz
year: "2022"
tag: Platform · Observability · FinOps
summary: Amazon MWAA was publishing thousands of high-cardinality Airflow metrics to CloudWatch, almost none of them used. I traced where they came from and cut them down to what the dashboards actually read.
metric: $2,500 → <$20 / month
order: 3
highlights: ["Reduced MWAA metrics costs"]
---

## Context

Méliuz ran its data pipelines on Amazon MWAA (managed Apache Airflow 2.2.2) in two environments,
staging and production. Out of the box, MWAA publishes Airflow's StatsD metrics to CloudWatch as
custom metrics, and CloudWatch bills every distinct custom metric, every month.

The CloudWatch bill for MWAA metrics had grown to an estimated **$2,500/month**.

## Diagnosis: count first

I started with an inventory of every MWAA metric in CloudWatch, grouped by dimension set:

| Dimensions | Metrics |
|---|---:|
| DAG, Environment, Task | 3,906 |
| DAG, Environment, State, Task | 2,013 |
| DAG Filename, Environment | 1,152 |
| DAG, Environment | 810 |
| Environment, Function / Job / Operator / Pool | 51 |
| **Total** | **7,932** |

The numbers pointed straight at the cause: cardinality. Airflow builds many metric names from
templates, so each template multiplies by the number of DAGs, tasks and states:

- `ti_successes` is a single name, so it produces 1 metric per environment.
- `dagrun.duration.success.{dag_id}` produces one metric per DAG (216 across both environments).
- `dag.{dag_id}.{task_id}.duration` produces one per task of every DAG (1,950).
- `ti.finish.{dag_id}.{task_id}.{state}` multiplies tasks by states (`success`, `failed`,
  `up_for_retry`): 2,013.

Every new DAG or task silently added more billable metrics, and staging doubled everything.

## What was actually used

Next I compared the inventory with consumption. The team's Airflow dashboard in Datadog read only
five metrics: task successes, task failures, tasks finished, task duration and successful DAG run
duration. Thousands of metrics were being paid for and never read, and even among the five, two
(tasks finished and task duration) were the per-task templates driving most of the count.

## The fix

Changing the configuration from the Airflow UI was disabled on MWAA, but Airflow supports an
allow-list, `metrics.statsd_allow_list`, and our Terraform module for MWAA already passed through
`airflow_configuration_options`. So the change was configuration as code, not a console tweak.

After reviewing the options with the team, we agreed to:

1. Stop publishing MWAA metrics from staging altogether.
2. Allow-list production to three essential metrics: `TaskInstanceSuccesses` and
   `TaskInstanceFailures` (one metric each per environment) and `DAGDurationSuccess` (one per DAG).
   The two per-task metrics were left out on purpose: they cost thousands of series for a
   level of detail nobody was acting on.

Both shipped as Terraform changes. The investigation, from the first inventory to the agreed
plan, took two days.

## Impact

- CloudWatch cost for MWAA metrics went from an estimated **$2,500/month to under $20/month**.
- Production went from thousands of series to about a hundred: two fixed metrics plus one per DAG.
  Staging publishes none.
- CloudWatch prorates custom metrics by the hour they publish data, and the per-DAG metric only
  publishes when its DAG runs. That is how the bill landed below $20 rather than at a flat
  per-metric price.

## Takeaways

- **Metric cost is cardinality.** A name templated with IDs is a multiplier, not a metric.
- **Measure before cutting.** Inventory by dimension, then compare with what is consumed.
- **Fix it in code.** The allow-list lives in Terraform, so it is reviewed, versioned and applied
  the same way to every environment.
