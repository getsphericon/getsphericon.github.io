---
title: "Segments"
---

A segment is a named, reusable rule that answers "which contacts match?". It is the one way to
choose who receives a broadcast.

## Build a rule

In **Segments**, combine conditions with all/any and nest groups where needed. A condition can
look at:

- **Attributes**: email, name, time zone, country, locale, city, birthday and the other core fields.
- **Custom fields**: any field your tracking or import created, with the operators its type
  supports: text is compared, a number is greater or less than a value, and a date is before or
  after a moment or within the last N days. A rule that names a field your workspace does not have is rejected when you save
  the segment.
- **Tags**: whether the contact has a tag or not.
- **Events**: whether the contact did, or did not do, something, or did it at least or at most
  N times, optionally within the last N days. Because delivery facts are events, you can target on `email.opened` or `email.clicked`
  the same way.

A live preview shows how many contacts match as you edit.

## Evaluated live

Membership is never stored. A segment is a query that runs when you preview it and when a
broadcast starts sending, so it reflects your data at that moment.

There is deliberately no list or "subscribed to X" group. Tags and custom fields describe a
contact; a segment decides who to target; and the opt-out rules described in
[Deliverability and consent](/docs/guide/deliverability) always subtract from the result.

## Segments through the API

The definition is a rule group: a `combinator` (`and` or `or`), an optional `not`, and `rules`,
each a rule or a nested group, told apart by `kind`. A rule has a `field`, an `operator` and a
`value`. An empty group matches every contact.

| `kind`       | Tests                                           | Fields                                                           |
| ------------ | ----------------------------------------------- | ---------------------------------------------------------------- |
| `rule`       | An attribute, a tag or a text custom field      | `field` (`email`, `country`, `tag`, `custom:<key>`, ...), `operator` (`eq`, `neq`, `contains`, `beginsWith`, `null`, `notNull`, and `has` or `doesNotHave` for a tag), `value` |
| `event`      | How many times the contact did something       | `action`, `operator` (`atLeast`, `atMost`), `times`, optional `withinDays` |
| `number`     | A number custom field                           | `field` (`custom:<key>`), `operator` (`gt`, `gte`, `lt`, `lte`), `value` |
| `date`       | A date-time custom field or `birthday`          | `field`, `operator` (`before`, `after`), `at`                    |
| `dateWithin` | A date that falls in the last N days            | `field`, `withinDays`                                            |
| `group`      | Nested rules                                    | `combinator`, optional `not`, `rules`                            |

"Did it" is `atLeast` 1 and "did not do it" is `atMost` 0. A date counts only with a UTC offset,
and a missing value makes a test false.

```sh
curl https://sphericon.example.com/api/segments/preview \
  -H "Authorization: Bearer $SPHERICON_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"definition":{"kind":"group","combinator":"and","rules":[
        {"kind":"rule","field":"custom:plan","operator":"eq","value":"pro"},
        {"kind":"event","action":"signed_up","operator":"atLeast","times":1,"withinDays":30}]}}'
```
