# DOMORA Domain Glossary

Core domain terms and concepts for the DOMORA property care and home service management platform.

## Roles

**Client**:
A property owner or tenant who uses DOMORA for property care, capable of holding recurring subscription plans, submitting one-off service requests, or both.
_Avoid_: Customer, User, Buyer

**Specialist**:
A verified home service technician or trade professional who receives matched job opportunities, manages their daily job agenda, and executes services on site.
_Avoid_: Worker, Contractor, Vendor, Handyman, Master

**Administrator**:
An internal platform operator who oversees system health, triages unassigned or emergency requests, reviews and approves specialist profiles, and manages pricing tariffs.
_Avoid_: Superuser, Moderator, Staff

## Services & Work

**Service Request**:
A discrete ticket created by a client for a home service, maintenance task, or repair, carrying a trade category, urgency priority, pricing, address, and lifecycle status.
_Avoid_: Order, Issue, Job (when referring to client ticket), Task

**Subscription Plan**:
A recurring property care service agreement providing scheduled preventive maintenance visits and discounted rates.
_Avoid_: Membership, Tier, Package

**Subscription**:
An active contract record in the database linking a client and property to a subscription plan tier, tracking validity period, visits remaining, and status.
_Avoid_: Agreement, Account tier

**Job Opportunity**:
A newly posted service request that matches a specialist's trade category and geographic area, available for them to accept or decline before it is scheduled.
_Avoid_: Lead, Offer, Bid

**Daily Agenda**:
The specialist's operational schedule of accepted service requests organized by appointment date, time, and execution status.
_Avoid_: Calendar, Roster, Timesheet

**Active Request Tracker**:
The primary real-time visual progress card on the client dashboard displaying the current execution stage of an in-flight service request.
_Avoid_: Status widget, Order progress

**Triage Queue**:
An operational list on the Administrator command center requiring immediate human decision-making (unassigned emergency requests, pending specialist approvals, or disputed jobs).
_Avoid_: Action list, Todo items

**Work Completion Report**:
A mandatory description submitted by a specialist upon finishing work on site that initiates the client confirmation and rating step.
_Avoid_: Invoice note, Closing comment

**Disputed Request**:
A service request where the client has flagged an issue with completed work; the specialist is given an opportunity to rectify it directly, while the Administrator tracks it in the triage queue.
_Avoid_: Complaint, Ticket conflict

**Admin Recommendation**:
An unassigned service request explicitly suggested to a specific specialist by an Administrator, appearing in their opportunities feed with high priority without forcing an instant lock.
_Avoid_: Admin invite, Manual ping
