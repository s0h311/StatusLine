# Status Tracking

A simple per-shop order/service status tracker where shop owners manage a linear status pipeline and customers check progress via a public reference code.

## Language

**Shop**:
An implicit tenant — each registered user owns exactly one Shop. A Shop has one **Status Sequence** and many **Orders**.
_Avoid_: Store, business, account

**Status Sequence**:
A single ordered list of **Statuses** belonging to a Shop. Orders move forward or backward through this sequence. The sequence can be edited at any time.
_Avoid_: Workflow, state machine, pipeline

**Status**:
A named step in a **Status Sequence**. May be flagged as "notify" to trigger a customer email on transition into it.
_Avoid_: State, phase, stage

**Order**:
A tracked job/service created by the shop owner for a **Customer**. Has a name, email, note, a **Reference Code**, and a current position in the **Status Sequence**.
_Avoid_: Job, ticket, request, service

**Reference Code**:
A short alphanumeric code (6–8 chars, uppercase) uniquely identifying an Order. Used by customers to look up their status on the public page.
_Avoid_: Tracking number, ticket ID, order number

**Customer**:
A person whose order is being tracked. Not a registered user — identified only by name and email on the Order. Interacts solely via the public status page and email notifications.
_Avoid_: Client, user, account

## Example dialogue

> **Dev:** A shop owner just registered. They go to set up their statuses — what do they see?
>
> **Domain expert:** An empty Status Sequence. They add statuses one by one in order — like "Nicht begonnen", "In Arbeit", "Fertig", "Abholbereit". They can check a box on any status to say "notify the customer when an order reaches this step."
>
> **Dev:** Then they create an Order?
>
> **Domain expert:** Right. They enter the customer's name, email, and a note describing the job. The Order gets a Reference Code and starts at the first Status. The customer gets an email with the code and a link.
>
> **Dev:** And when the admin moves the order to "Abholbereit"?
>
> **Domain expert:** If that status is flagged as notify, the customer gets a generic email: "Your status was updated. Use your reference code to check." That's it.
