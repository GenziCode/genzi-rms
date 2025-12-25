# 🛡️ Roles & Permissions - Feature Overview
**Last Updated:** 2025-11-23 14:05

## 📖 Introduction
The Roles & Permissions module is the backbone of Genzi RMS security. It allows administrators to define granular access controls for every aspect of the system, ensuring that users only have access to the data and actions relevant to their job functions.

## 🌟 Key Features

### 1. Granular Permission System
- **100+ Permissions**: Covering POS, Inventory, HR, Finance, and System settings.
- **Capability-Based**: Permissions are based on actions (e.g., `pos:void`, `inventory:adjust`) rather than just pages.
- **Wildcard Support**: Support for `*` (Super Admin) and `module:*` (Module Admin) patterns.

### 2. Role Management
- **Built-in Roles**: Pre-configured roles for common scenarios (Owner, Admin, Manager, Cashier, Inventory Clerk).
- **Custom Roles**: Create unlimited custom roles tailored to specific business needs.
- **Role Inheritance**: Clone existing roles to quickly create variations (e.g., "Senior Cashier" from "Cashier").

### 3. Scope Control (Data Access)
- **Global Access**: Access data across the entire tenant.
- **Store-Level Access**: Restrict users to specific stores.
- **Department-Level Access**: (Coming Soon) Restrict access to specific product categories or departments.

### 4. Advanced Analytics
- **Usage Metrics**: Track how many users are assigned to each role.
- **Security Score**: Monitor the "least privilege" compliance.
- **Audit Logs**: (Planned) Track who changed what permission and when.

## 👥 User Personas

| Persona | Typical Role | Needs |
|---------|--------------|-------|
| **Business Owner** | Owner | Full access, dashboard view, financial reports. |
| **Store Manager** | Manager | Manage staff, inventory, overrides, and daily reports. |
| **Cashier** | Cashier | Fast POS access, limited refunds, no inventory editing. |
| **Stock Clerk** | Inventory Clerk | Receive stock, count inventory, no sales access. |
| **Accountant** | Custom | Read-only access to financial reports and invoices. |

## 🖼️ UI/UX Design
The module features a **Glassmorphism-inspired** interface with:
- **Dashboard Overview**: High-level stats at a glance.
- **Matrix View**: A powerful grid to visualize and edit permissions across all roles.
- **Wizard-Style Editors**: Step-by-step role creation to prevent errors.

---
*Genzi RMS Documentation*
