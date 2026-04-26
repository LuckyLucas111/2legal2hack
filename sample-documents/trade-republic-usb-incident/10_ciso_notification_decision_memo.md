# CISO Notification Decision Memo

Document type: CISO decision memo
Role: CISO
Incident ID: TR-USB-2026-04-26-001
Created: 2026-04-26 16:00 CEST
Status: Draft decision record
Classification: Confidential - Management Decision

## Decision Needed

The CISO must decide whether to instruct:

1. Notification to the competent data protection supervisory authority.
2. Communication to affected data subjects.
3. Activation of financial-sector cyber incident notification workflow.
4. Notification to payment-card processor or scheme partners.

## Current Fact Basis

Confirmed:

- Export of payment-card reconciliation data by employee `trb\mkeller`.
- Copy to unauthorised USB device completed.
- USB device has not been recovered.
- Employee account disabled.
- Workstation isolated.
- Export contained approximately 18,742 customer records.
- Export contained full PAN and contact data.
- No CVV, PIN, password, MFA secret, or seed phrase currently indicated.
- No customer-facing service outage.

Unconfirmed:

- Whether employee copied data onward.
- Whether any fraud has occurred.
- Whether all PANs were active.
- Whether card replacement is required.
- Final deduplicated customer count.

## Inputs Received

DPO:

- GDPR applies.
- Authority notification recommended.
- Customer communication likely required due high risk.

Legal:

- Conservative notification posture recommended.
- Legal hold and employee return demand recommended.
- Criminal complaint preparation recommended.

IT-Sec:

- Copy to USB confirmed with high confidence.
- No malware or lateral movement currently detected.
- No onward transfer seen in company proxy logs.

SysAdmin:

- Account disabled and export permissions restricted.
- Service availability unaffected.
- Maximum scope remains 18,742 records.

Compliance:

- Significant control failure.
- DORA/NIS/KRITIS internal workflow should be activated pending threshold confirmation.
- Payment-card contractual obligations must be checked.

Communications:

- Customer notification and media holding statement prepared.
- Recommend direct communication after approval.

## Decision Options

Option A: Notify supervisory authority now and prepare customer communication.

Advantages:

- Aligns with DPO and Legal recommendation.
- Reduces risk of late notification.
- Demonstrates accountability.
- Allows later updates as facts mature.

Disadvantages:

- Some facts are preliminary.
- May trigger regulator questions before final forensic report.

Option B: Delay notification pending final forensic report.

Advantages:

- More complete facts.
- Better customer count and mitigation details.

Disadvantages:

- Increases late-notification risk.
- High-risk indicators are already present.
- USB unrecovered means risk is unlikely to be eliminated quickly.

Option C: Do not notify.

Advantages:

- Avoids immediate regulatory escalation.

Disadvantages:

- Not supported by current facts.
- High legal, regulatory, and reputational risk.
- Inconsistent with DPO, Legal, and Compliance recommendations.

## Recommended Decision

Choose Option A.

Decision wording:

"Based on current evidence, I classify incident TR-USB-2026-04-26-001 as a critical confidentiality incident involving customer personal data and payment-card data. I instruct ISO, DPO, Legal, Compliance, and Communications to proceed with supervisory authority notification without undue delay, prepare direct communication to affected customers, activate the financial-sector cyber incident workflow pending final threshold confirmation, and coordinate payment-card mitigation with relevant partners."

## Immediate CISO Actions

- Approve GDPR authority notification.
- Approve customer communication preparation.
- Require hourly executive updates until initial notifications are completed.
- Assign owner for payment-card mitigation decision.
- Assign owner for employee/legal action.
- Assign owner for control remediation plan.

## Decision Record

Decision: Pending CISO signature.

Decision owner: CISO.

Timestamp: Pending.

Rationale: Pending.

Follow-up review: 2026-04-27 09:00 CEST.

