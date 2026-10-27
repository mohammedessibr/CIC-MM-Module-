# Vendor Evaluation Tracker - System Blueprint

## Executive Summary
The Vendor Evaluation Tracker is a custom SAP ABAP application designed to streamline and automate the process of assessing vendor performance. The core business objective is to track, calculate, and analyze key performance indicators (KPIs) such as delivery reliability, quality of goods, and pricing compliance based on purchasing data. By replacing manual tracking methods, this application enables procurement teams to make data-driven sourcing decisions, mitigate supply chain risks, and foster better supplier relationships via a modern SAP Fiori interface.

## Data Dictionary (DDIC) Architecture
### ZVEND_EVAL (Vendor Evaluation Header)
*   **MANDT** (MANDT): Client, Primary Key
*   **EVAL_ID** (ZEVAL_ID): Evaluation Run ID, Primary Key
*   **LIFNR** (LIFNR): Vendor Account Number
*   **EKORG** (EKORG): Purchasing Organization
*   **EVAL_DATE** (DATS): Date of Evaluation
*   **TOTAL_SCORE** (ZTOTAL_SCORE): Overall Evaluation Score
*   **EVAL_STATUS** (ZEVAL_STATUS): Status (e.g., Draft, Approved, Rejected)
*   **CREATED_BY** (UNAME): Created By User
*   **CREATED_ON** (DATS): Created On Date

### ZVEND_EVAL_ITEM (Vendor Evaluation Metrics)
*   **MANDT** (MANDT): Client, Primary Key
*   **EVAL_ID** (ZEVAL_ID): Evaluation Run ID, Primary Key, Foreign Key to `ZVEND_EVAL`
*   **METRIC_ID** (ZMETRIC_ID): Metric Identifier (e.g., QTY, DEL, PRD), Primary Key
*   **SCORE** (ZMETRIC_SCORE): Score achieved for the specific metric
*   **WEIGHT** (ZMETRIC_WEIGHT): Weighting factor applied to the metric
*   **COMMENTS** (ZCOMMENTS): Evaluator's qualitative comments

## Data Exposure Layer (CDS Views)
*   **ZI_VendorEvaluation (Root Interface View):** Basic foundational view on `ZVEND_EVAL` for transactional processing and BOPF/RAP integration.
*   **ZI_VendorEvalItem (Interface View):** Basic foundational view on `ZVEND_EVAL_ITEM` featuring a compositional association to the parent `ZI_VendorEvaluation`.
*   **ZC_VendorEvaluation (Consumption/Projection View):** Exposes header data, enabled for UI/OData, enriched with UI annotations, search helps for `LIFNR` and `EKORG`.
*   **ZC_VendorEvalItem (Consumption/Projection View):** Exposes item/metric data, enabled for UI/OData, joined with metric text tables.

## Business Logic & OO-ABAP Layer
*   **ZIF_VEND_EVAL_OP:** Interface defining standard behavioral operations (Calculate, Approve, Reject).
*   **ZCL_VEND_EVALUATION_MGR:** Core business logic manager class implementing `ZIF_VEND_EVAL_OP` to orchestrate actions.
    *   `CALCULATE_OVERALL_SCORE()`: Aggregates item scores against their respective weights.
    *   `CHANGE_STATUS()`: Handles status transitions alongside required validations.
*   **ZCL_VEND_METRICS_CALC:** Utility class responsible for complex metric computations.
    *   `CALC_DELIVERY_RELIABILITY()`: Analyzes Goods Receipts (`MSEG`/`MKPF`) vs PO Delivery Dates (`EKET`).
    *   `CALC_QUALITY_SCORE()`: Interfaces with QM module to analyze Quality Notifications (`QMEL/QMFE`).

## Service & Integration Layer
*   **Z_VENDOR_EVAL_SRV:** OData V2/V4 service generated predominantly from CDS consumption view annotations (`@OData.publish: true` or via Service Binding in RAP) to serve the SAP Fiori Elements frontend.
*   **ZCL_VEND_EVAL_REST_API:** Standalone HTTP handler class (implementing `IF_HTTP_EXTENSION`) representing a REST API to expose JSON payloads. This enables third-party enterprise platforms (e.g., Ariba, external data lakes) to retrieve finalized evaluation scores without OData overhead.

## Authorization & Security
*   **Z_VEND_EVL:** Custom authorization object.
    *   *Fields:* `EKORG` (Purchasing Organization), `ACTVT` (Activity: 01 Create, 02 Change, 03 Display, 43 Release/Approve).
*   **PFCG Role Mapping:**
    *   *Procurement Specialist (Z_ROLE_PROC_SPEC):* Granted Activity 01, 02, 03 for their assigned purchasing organizations.
    *   *Procurement Manager (Z_ROLE_PROC_MGR):* Granted Activity 03, 43 for their assigned purchasing organizations, allowing them to finalize scores.

## Extension & Enterprise AI Hooks
*   **BAdI (ZBADI_VEND_EVAL_CALC):** Custom enhancement spot allowing specific company codes or plants to implement localized metric calculation rules, keeping standard global logic untouched.
*   **Business Event Hook (ZENH_VEND_EVAL_POST):** Raised post-approval; usable for triggering enterprise alert workflows or integration with SAP Event Mesh.
*   **Enterprise AI Integration Endpoint:** An API path exposed to SAP BTP Generative AI Hub. It accepts unstructured vendor communication logs (emails, incident reports) and uses AI to predict risk. The AI copilot can invoke `ZCL_VEND_EVALUATION_MGR->SUGGEST_SCORE()` to pre-fill the evaluation draft for a human buyer to review.
