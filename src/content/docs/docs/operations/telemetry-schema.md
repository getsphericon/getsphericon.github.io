---
title: Telemetry report schema
---

The exact body of the anonymous Telemetry report an Instance sends once a day. It carries no
name, domain, address, host, error text, licence key or exact number. Counts are orders of
magnitude, never exact figures. The schema is the contract: every report an Instance builds is
checked against it.

The [report operation and its schema](/docs/operations/telemetry-schema-reference) are generated
from the specification. The raw document is
[`openapi/telemetry.openapi.json`](https://github.com/getsphericon/sphericon/blob/main/openapi/telemetry.openapi.json)
in the repository.
