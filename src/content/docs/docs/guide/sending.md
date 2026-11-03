---
title: "Sending email"
---

Sphericon has three send surfaces. They differ in who triggers them, and they share templates,
sending domains and consent rules.

## Templates

Templates carry email-ready HTML (tables and inline styles, so the message works across mail clients).
A body that is not valid HTML, or a Liquid syntax error, is refused when it is saved and again when a
send is planned. Subjects and bodies support [Liquid](https://shopify.github.io/liquid/)
(conditionals and filters). Merge tags come from the contact: <code>{{ email }}</code>, <code>{{ first_name }}</code>,
<code>{{ last_name }}</code> and any of its custom fields; transactional calls can add their own variables.
Tracking (an open pixel, click rewriting and the unsubscribe footer) is layered on after
rendering, and a plain-text part is generated for you.

For marketing sends the template content is **copied** into the broadcast or automation step when
you author it, so editing a template later never rewrites mail that is already queued.
Transactional sends do the opposite and bind the template **by reference**, so your app can
update its receipt wording without a deploy.

## Broadcasts

A broadcast is one email to a segment.

1. Set a name, sender, subject and body.
2. Choose the audience segment.
3. Send a test. Without a verified sending domain it goes only to your own address, from the
   platform's sender (the editor shows which From it used); with one, to any address you name,
   through your Integration. See the [Quickstart](/docs/guide/quickstart#see-an-email-before-dns).
4. Send it now, or schedule it. A scheduled broadcast can be unscheduled again.

A broadcast moves through `draft`, `scheduled`, `sending`, `sent` or `failed`. Its report lists
sent, opened, clicked and unsubscribed counts. Sending runs on a durable job queue backed by
PostgreSQL, so a restart does not lose work.

## Automations

An automation starts when a contact does something and then runs an ordered list of steps.

| Step         | What it does                                                                                 |
| ------------ | -------------------------------------------------------------------------------------------- |
| `email`      | Send a message with its own subject and HTML body.                                           |
| `wait`       | Pause for a number of seconds before the next step.                                          |
| `apply_tag`  | Add a tag to the enrolled contact.                                                           |
| `remove_tag` | Remove a tag from the enrolled contact.                                                      |
| `http`       | `POST` a JSON body to a URL, with up to five headers of your own and an optional signature. |

The trigger is an event action, such as `signed_up`. A contact is enrolled once. The steps can
use the event that started the enrollment as `event.action` and `event.properties`, next to the
contact's own fields. An `http` step's body is a Liquid template that has to render to valid JSON;
dry-run it for a contact before you publish. Its URL, headers and signing secret are never returned
once saved.

**Leaving early.** An automation can name **exit events** and one **goal event**. When the contact
records one of them, the enrollment ends at once: an exit event as an early exit, the goal event as
`goal_reached`. Neither may be the trigger. Each automation is its own unsubscribe scope, so
leaving one sequence does not silence the others.

**Draft and publish.** An edit never changes a live automation. It writes a draft, and **Publish**
makes the draft live. Contacts already enrolled finish on the version they began on. **Revert**
drops the draft, and **Deactivate** stops new enrollments and keeps the live version. A new
automation is inactive until you publish it, and publishing needs its own scope (see
[API](/docs/guide/api)).

**Results.** The automation's report shows its emails' engagement and, over a period of 7, 14, 30
or 90 days, how many enrollments began, completed, reached the goal, left early or failed, and the
revenue credited to it (see [Orders and revenue](/docs/guide/tracking#orders-and-revenue)).

## Rules

A rule is a single reaction to a single event, with no sequence behind it: when one of its trigger
events is recorded for a contact and the contact matches its condition, its actions run at once.
Use it for "tag whoever clicked this link" or "tell the CRM a trial started". Anything with a delay
or an email stays an automation.

| Action              | What it does                                                           |
| ------------------- | ---------------------------------------------------------------------- |
| `apply_tag`         | Add a tag to the contact.                                              |
| `remove_tag`        | Remove a tag from the contact.                                         |
| `enroll_automation` | Enroll the contact in an automation, once ever.                        |
| `http`              | `POST` to a URL, as an automation's `http` step does.                  |

The condition is the same one a [segment](/docs/guide/segments) uses, and it may also test the
triggering event's own properties. A rule fires on every matching event, so "once per contact" is a
condition plus an `apply_tag` action. A rule has at most 20 actions, of which at most 5 call a URL.

Rules follow the same draft and publish cycle as automations, and act only on events recorded after
they were published. Dry-run a rule on a stored event to see what would fire; nothing runs. Every
time a rule fires it leaves a **firing**, which records how each action ended.

## Transactional email

Your application sends a single email to one address with `POST /api/emails`, naming a template
and the variables to fill it with:

```sh
curl https://sphericon.example.com/api/emails \
  -H "Authorization: Bearer $SPHERICON_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "templateId": 12,
    "destination": "ada@example.com",
    "variables": { "reset_url": "https://app.example.com/reset?token=..." }
  }'
```

The token needs the `emails:send` scope. Transactional mail skips marketing unsubscribes, since
nobody can opt out of their own password reset, but it still respects the suppression list: an
address that hard-bounced or complained is never mailed. A suppressed destination returns the
status `suppressed`.

## Test inbox

A **test inbox** is an integration that sends nothing outside. What a send through it would have
delivered is kept as a **captured message**, with its headers, its HTML and text and its links, and
you read it in the app. Use it to see what your mail looks like and does before a real provider or
DNS exists. Pick it, make it the default and rate-limit it like any other integration. Every report
of such a send says it was captured, not delivered. It keeps at most 200 messages for 7 days and
takes at most 200 a day, and erasing a contact erases the messages captured for its address. The
messages are also available over the [API](/docs/guide/api).

## Transports

Add one or more integrations in **Settings → Sending**:

- **SMTP**: any server that accepts SMTP.
- **SES-compatible API**: Amazon SES, or any service that implements the same API, such as Yandex
  Cloud Postbox. Set the integration's **endpoint** to the service's URL; leave it empty for
  Amazon SES itself.

Bounces and complaints become suppressions only through the integration's hook, set up under
**Inbound** with a Preset (SES, Postmark, Mailgun or generic). Plain SMTP gets none: see
[Bounces and complaints](/docs/guide/deliverability#bounces-and-complaints).

Credentials are encrypted at rest. Because DKIM signing happens in Sphericon itself, switching
transport does not mean re-verifying your domain.
