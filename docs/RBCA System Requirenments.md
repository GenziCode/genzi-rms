🧭 System Context

You are an expert enterprise systems architect and security designer with 15+ years of experience in ERP/EMS and Inventory Management System development.
Your goal is to design a comprehensive Role-Based Control & Distribution (RBCD) framework that governs roles, permissions, scopes, and data distribution across all modules, tabs, sub-tabs, fields, actions, and UI components in our next-generation ERP/EMS Inventory Management Platform.

The system must support:

Full control and flexibility for administrators.

Granular access down to module, record, and field level.

Scalable management for multi-company, multi-branch, and multi-warehouse setups.

Compliance with ISO 27001, GDPR, SOC 2, and internal audit requirements.

🎯 Objectives

Define every role, permission, and scope clearly.

Map roles to UI components (views, tabs, actions, fields).

Allow contextual distribution (e.g., “Inventory Manager – Warehouse A only”).

Establish data ownership and hierarchy (e.g., users can only view records they own or their department owns).

Include control policies: time-bound, conditional, and workflow-based permissions.

Ensure full compatibility with mobile-first PWA, desktop, and native app UX — role permissions must dynamically render the correct interface.

🧩 Deliverables the Agent Must Produce

The agent should return a detailed, structured, hierarchical system specification including the following:

1. Role Hierarchy Tree (Organization-Level)

Define system-wide roles, grouped by departments and authority levels:

Executive Roles: CEO, CFO, COO, CIO, CTO

Administrative Roles: Super Admin, System Admin, Department Admin

Operational Roles: Inventory Manager, Procurement Officer, Sales Executive, Finance Officer, Production Supervisor, HR Manager, Project Manager, Quality Inspector

Support Roles: Customer Support Agent, Vendor Portal User, Supplier, Auditor, Compliance Officer

External / Limited Access Roles: Partner, Client, Guest

2. Permission Matrix (CRUD + Workflow + Data)

Each role should have explicit permissions mapped to modules and actions.

Role Module Create Read Update Delete Approve Export Assign Comment Scope
Super Admin All ✅ ✅ ✅ ✅ ✅ ✅ ✅ ✅ Global
Inventory Manager Inventory, Warehouse, Stock ✅ ✅ ✅ ❌ ✅ ✅ ✅ ✅ Assigned Warehouse(s)
Procurement Officer Purchase, Vendor ✅ ✅ ✅ ❌ ✅ ✅ ✅ ✅ Company Only
Sales Executive Sales, CRM ✅ ✅ ✅ ❌ ❌ ✅ ❌ ✅ Assigned Clients Only
Finance Officer Accounting, Reports ❌ ✅ ✅ ❌ ✅ ✅ ❌ ✅ All Branches
HR Manager HR, Payroll ✅ ✅ ✅ ❌ ✅ ✅ ✅ ✅ All Departments
Auditor Audit, Compliance ❌ ✅ ❌ ❌ ❌ ✅ ❌ ✅ Read-Only
Vendor Vendor Portal ❌ ✅ ❌ ❌ ❌ ❌ ❌ ✅ Own Data Only 3. View & UI Access Mapping

Every module should dynamically render UI components based on role permissions.

UI Element Controlled by Role Visibility Action
Navigation Menu Items Role/Module access Hidden if unauthorized –
Tabs/Sub-tabs Role permission Auto-hide –
Buttons (Add, Edit, Delete, Approve) CRUD permission Show/Hide dynamically Disable if restricted
Cards / Tables / Charts Data scope Filter automatically –
Fields Field-level permission Read-only / Hidden Mask sensitive fields
Dashboards Role type Custom widgets Personalized layout

Example:

Sales Executive sees only “CRM → Leads → Quotations” tabs.

Inventory Manager sees “Stock → Items → Transfers → Adjustments.”

Finance Officer sees “Reports → Ledger → Trial Balance → Tax Summary.”

4. Scope Distribution Model (Data Access Context)

Define data access boundaries for each role.

Scope Type Description Example
Company-Level Multi-company setups, isolated data Company A cannot see Company B’s data
Branch-Level Access restricted by branch Delhi branch cannot view Mumbai data
Warehouse-Level Specific warehouses only Inventory Manager (WH-1 only)
Region-Level Geo-based access East zone vs. West zone
Record-Level Owned or assigned records Sales Executive sees only their own leads
Field-Level Restricted fields (salary, cost price) Hidden for non-admins 5. Control Policies (RBCD Rules)

Advanced governance features:

Time-Based Access: Limit role activity (e.g., warehouse access only during working hours).

Approval Chains: Require multilevel approval before executing sensitive actions (e.g., PO approval).

Conditional Access: e.g., Finance can view only Approved invoices.

Delegation Rules: Temporarily assign roles (for vacation or shift handover).

Audit Logging: Every role action logged (create, edit, approve, export, view).

Two-Factor Enforcement: For financial or admin operations.

6. Dynamic Rendering Logic (Frontend/UI Integration)

Auto-hide unauthorized modules/tabs.

Disable restricted buttons (greyed out).

Display “Access Denied” or masked data for unauthorized records.

Use JWT role claims or GraphQL directives to enforce permission logic.

Maintain real-time sync between RBCD and UI layout across PWA, desktop, and mobile.

7. Admin Control Panel (RBCD Management Module)

Super Admin should be able to:

Create/Edit/Delete/view Roles

Assign/Unassign users to roles

Manage permissions by module and action

Define data scopes (company, branch, warehouse)

Set approval workflows and delegation rules

Generate Audit Reports by role/user

Import/Export RBCD configuration templates

8. Optional Enhancements

AI-driven Permission Suggestion: Recommend optimal permissions based on user behavior.

Adaptive Access Control (AAC): Automatically tighten/relax permissions based on context (e.g., login from unknown device triggers read-only mode).

Role Simulation Mode: Admin can preview what a user sees under a given role.

Custom Role Builder: UI for non-technical admins to build custom roles easily.

9. Output Format Required from the AI Agent

Return your full RBCD system design in this structure:

Section 1: Role Hierarchy (Tree View)

Section 2: Permission Matrix (Table)

Section 3: UI/UX View Mapping

Section 4: Data Scope & Distribution Model

Section 5: Control Policies & Automation

Section 6: RBCD Management Module Design

Section 7: Future Enhancements & Scalability Notes

✅ Final Instruction Line

“Follow this prompt precisely and produce a complete, production-ready RBCD (Role-Based Control & Distribution) framework that can manage every aspect of our ERP/EMS/Inventory application — from roles and permissions to field-level UI control, audit tracking, and scope-based data access — fully aligned with enterprise security, UX, and compliance standards.”
