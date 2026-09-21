# 1. Role Workspaces and Hybrid Client Model

DOMORA serves three distinct user roles—Client, Specialist, and Administrator—each requiring specialized operational views rather than generic CRUD tables. We decided to structure the workspace into dedicated role hubs (`/client`, `/specialist`, `/admin`) with separate sub-routes for deep tables, and establish a hybrid service model for Clients.

Under this hybrid model, Clients can hold recurring Subscription Plans for preventive care, but can also submit one-off Service Requests for urgent repairs or major home projects without requiring an active subscription. Specialists operate on a hybrid workflow combining a matched Job Opportunities claim queue with an active Daily Agenda. Administrators operate a Command Center focusing on exception triage (unassigned emergency requests, pending specialist approvals) and platform metrics.
