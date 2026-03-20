# TMSLite: Project Overview and Features

TMSLite is a modern, lightweight Transportation Management System (TMS) designed to streamline logistics operations, improve workflow efficiency, and provide deep visibility into the shipping lifecycle. Built on a powerful Next.js and Supabase stack, it offers a robust solution for managing customers, carriers, and multi-modal shipments.

---

## 🚀 Core Value Proposition
TMSLite centralizes logistical complexity into a single, intuitive interface. It automates the transition from sales lead to customer and from quote to delivered load, ensuring that every piece of documentation—from Bills of Lading (BOL) to Invoices—is professional, compliant, and synchronized with your company branding.

---

## 🛠️ Key Feature List

### 📦 Load & Shipping Management
*   **Comprehensive Load Lifecycle**: Manage loads through every stage: `Not Dispatched`, `Dispatched`, `In-Transit`, `Delivered`, `Invoiced`, and `Cancelled`.
*   **Multi-Modal Quoting**:
    *   **Spot Quotes**: Quickly generate and save spot quotes with specific **Shipment Type** (LTL, FTL, Parcel, etc.) categorization.
    *   **LTL Quoting**: Integrated support for Less-Than-Truckload shipments with regional and carrier-specific logic.
*   **Automated Document Generation**: Generate high-quality PDFs with dynamic layout support:
    *   **Bills of Lading (BOL)**: Automated itemization with NMFC class, weight tracking, and dedicated grid columns.
    *   **Rate Confirmations**: Professional documents to finalize carrier agreements.
    *   **POD & Invoices**: Seamless transition from delivery to billing.

### 👥 CRM & Sales Operations
*   **Lead Pipeline**: Track potential business from 'New' to 'Converted' status with a unified pipeline view.
*   **Activity Logging**: Record phone calls, emails, and meetings directly against sales leads for full accountability.
*   **Customer Relationship Management**: Centralized database for customers, including credit hold management, payment terms, and multiple contact points.
*   **Document Vault**: Securely upload and associate files (contracts, insurance, etc.) with specific customers.

### 📅 Calendar & Scheduling
*   **Interactive Month View**: Full-screen calendar for tracking appointments, pickup/delivery windows, and tasks.
*   **Role-Based Event Assignment**: Admins and Supervisors can assign events to specific users or broadcast tasks to entire job roles (e.g., "All Sales Reps").
*   **Real-Time Coordination**: Integrated status tracking (Pending vs. Completed) and automatic holiday highlighting for improved operation planning.

### 🚛 Carrier & API Integration
*   **Carrier Accounts**: Manage relationships with major carriers (e.g., ODFL, XPO, Estes).
*   **Encrypted API Suite**: Securely store and use carrier API credentials (keys, secrets) for live quoting and tracking.
*   **SCAC Code Management**: Standardized carrier identification for accurate reporting.

### ⚙️ Administration & Intelligence
*   **Business Intelligence (BI) Dashboard**: 
    *   **Visual Data Trends**: Track Volume, Revenue, and Margin via interactive Recharts.
    *   **Data Transparency**: Integrated data tables below every chart for granular inspection of weekly metrics.
    *   **Functional Reporting**: Export reports to Excel or generate print-friendly PDF summaries.
*   **Template Editor**: A powerful admin interface to customize the HTML/CSS layout of shipment documents (BOLs, Quotes) to match company branding.
*   **Role-Based Access Control (RBAC)**: Fine-grained permissions for Admins, Supervisors, Sales Reps, and Customer Service Reps (e.g., role-specific calendar visibility).
*   **Organization Isolation**: Multi-tenant architecture ensuring data privacy and security between different business units.

---

## 🧪 Technical Stack
*   **Framework**: Next.js 16 (App Router)
*   **Database**: Supabase (PostgreSQL) with Row-Level Security (RLS)
*   **Authentication**: Supabase Auth (JWT-based)
*   **Styling**: Tailwind CSS 4 & Radix UI
*   **Data Handling**: TanStack Table & Recharts
*   **Security**: AES-256 Symmetric Encryption for API credentials via `pgcrypto`
