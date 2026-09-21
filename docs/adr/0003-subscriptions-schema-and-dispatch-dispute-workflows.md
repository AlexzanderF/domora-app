# 3. Subscriptions Schema and Dispatch/Dispute Workflows

To support DOMORA's hybrid client offering, recurring home maintenance agreements are modeled as a dedicated `subscriptions` entity linked to the client and property, keeping user identity cleanly decoupled from property service contracts.

For operations, dispatch and dispute handling follow a dual-track model:

1. **Admin Dispatch**: Administrators have two dispatch tools for unassigned requests: a _Direct Assignment_ (force-allocates to a specialist for emergencies) and a _Recommended Assignment_ (highlights the request as "Препоръчана от администратор" in the specialist's opportunities without forcing an immediate lock).
2. **Dispute Resolution**: When a client flags an issue on a completion report, the request is flagged with an issue state, placing it simultaneously into the specialist's agenda for direct rectification and into the Administrator's triage queue for continuous oversight without unnecessary intervention.
