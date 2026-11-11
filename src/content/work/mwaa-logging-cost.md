---
title: From $2,500 to under $20 a month in logs
company: Méliuz
year: "2021–2023"
tag: Platform · Observability
summary: Reconfiguring Amazon MWAA (managed Airflow) logging in CloudWatch across two environments.
metric: $2,500 → <$20 / month
order: 3
highlights: ["Reduced MWAA logging costs"]
---

## Context

Managed Airflow (MWAA) can ship a large volume of logs to CloudWatch by default. Left untuned,
the logging bill can rival the cost of the workloads themselves.

## What I did

Optimized the logging configuration of both MWAA environments, keeping the logs that matter
and dropping the noise.

## Impact

- CloudWatch logging cost went from an estimated **$2,500/month to under $20/month**.
- Less noise also meant more useful metrics.
