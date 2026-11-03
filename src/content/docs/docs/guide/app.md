---
title: "The Sphericon app"
---

Everything in the app happens inside a [workspace](/docs/guide/introduction#the-model-in-five-ideas).
The sidebar lists its sections; **Settings** has a sidebar of its own. The workspace switcher in
the header moves you between workspaces, and **Docs** in the header opens this documentation.

## Sections

**Overview.** The landing page of a workspace. It leads with **Needs attention**: what is stopping
or slowing your mail right now, such as a sending domain that lost its DKIM record or has no DMARC
record, a provider that refused your credentials or stopped the account, a broadcast that is on hold
or failed, an automation that cannot send, a webhook that disabled itself, or a daily sending limit
that is spent. Each item links to where you fix it, and the block is absent while nothing is wrong.
Below it come the setup checklist while the workspace is new (add a contact, connect an
integration, verify a sending domain, send a first email), recent sends, the period's sending and
audience, and revenue once the first order arrives.

**Contacts.** Every person the workspace knows, identified or anonymous. Filter by status, open a
contact to see its fields, tags and event history, edit custom fields, export its data or erase it
(owners and admins only, see [Answering a GDPR request](/docs/guide/gdpr)). See
[Tracking visitors and events](/docs/guide/tracking).

**Segments.** Saved rules that select contacts by attributes, tags and behavior. **Preview
audience** shows how many contacts match right now; membership is always evaluated live. See
[Segments](/docs/guide/segments).

**Broadcasts.** One-off emails to a segment (or to all active contacts), sent now or scheduled,
with a test send and a report of recipients, opens and clicks. Unsubscribed and suppressed
contacts are always excluded. See [Sending email](/docs/guide/sending).

**Templates.** Reusable email bodies written in MJML with merge tags such as
`{{ first_name }}`, shared by broadcasts and automations.

**Automations.** Sequences started by an event and run once per contact: send an email, apply or
remove a tag, wait, post JSON to a URL. An edit is a draft until you publish it; you can also
deactivate an automation, end enrollments early with exit and goal events, read its results and
revenue, and inspect failed enrollments. See [Sending email](/docs/guide/sending#automations).

**Rules.** A single reaction to an event, without a sequence: tag the contact, enroll them in an
automation or call a URL. Rules are drafted and published like automations and list their firings.
See [Sending email](/docs/guide/sending#rules).

**Transactional emails.** The log of single emails your app triggered over the
[API](/docs/guide/api): recipient, status, send time and the error when delivery failed.

**Analytics.** Reports over the last 7, 30 or 90 days, counted by calendar day in the workspace time
zone: email metrics, clicks by link, opens by hour, new people, subscribed people, events and recent
activity.

**Activity.** The live feed of events arriving in the workspace, from the tracker, the API and
Sphericon's own delivery events. Filter by action and open an event to see its properties.

**Settings.** Configuration of the workspace, described below.

## Settings

**General.** The workspace name and the postal address shown in the footer of every marketing
email (CAN-SPAM requires one).

**Team and security.** Members and their [roles](#roles), pending invitations, the requirement that every
member uses two-factor authentication (a sign-in with a Passkey meets it, a password sign-in needs an
authenticator app), and the audit log of changes (an Enterprise feature, with a
configurable retention).

**Tracking.** The snippet to paste into the `<head>` of your site, a way to send a test event from
your terminal, the installation status that flips once the first event arrives, and the optional
tracking domain that serves the snippet and the links in your mail on a host of your own. See
[Tracking visitors and events](/docs/guide/tracking) and
[Tracking domain](/docs/guide/deliverability#tracking-domain).

**Sending.** Integrations (the SMTP or SES providers the workspace sends through, with the
inbound hook for bounces and complaints), sending domains with the DKIM, SPF and DMARC records to
publish, and the suppression list of addresses
that are never mailed. See [Deliverability and consent](/docs/guide/deliverability) and
[Presets for provider callbacks](/docs/guide/presets).

**Developers.** API keys and webhook endpoints. See [API](/docs/guide/api) and
[Webhooks](/docs/guide/webhooks).

**AI agents (MCP).** The address to add as a connector in Claude or any MCP client so an agent can
work in the workspace. Only an owner or admin can approve the connection. See
[MCP for agents](/docs/guide/mcp).

## Roles

Every member is an owner, an admin or a member. Access is checked on every operation, in the app,
the API and over MCP, and the app hides the controls a role cannot use.

| What                                                                                     | Owner | Admin | Member |
| ---------------------------------------------------------------------------------------- | :---: | :---: | :----: |
| Contacts, segments, tags, templates, broadcasts, automations, rules, imports and sending |   ✓   |   ✓   |   ✓    |
| Read the suppression list                                                                |   ✓   |   ✓   |   ✓    |
| Export or erase contacts, add or lift suppressions                                       |   ✓   |   ✓   |        |
| Invite and remove members, change roles, see anyone's connections                        |   ✓   |   ✓   |        |
| API tokens, webhooks, integrations, sending domains, tracking domain                     |   ✓   |   ✓   |        |
| Audit log, two-factor requirement                                                        |   ✓   |   ✓   |        |
| Workspace name, address and time zone, brand kit, join domains                           |   ✓   |   ✓   |        |
| Reporting currency and attribution window                                                |   ✓   |   ✓   |        |
| Make someone an owner, change or remove an owner                                         |   ✓   |       |        |
| Delete and restore the workspace                                                         |   ✓   |       |        |

A member can still send, but cannot export the contacts or lift a suppression: those are the two
bulk actions on personal data and on consent.
