# Compliance Assessment

Document type: Compliance assessment
Role: Compliance
Incident ID: TR-USB-2026-04-26-001
Created: 2026-04-26 14:30 CEST
Status: Submitted to ISO, Legal, CISO
Classification: Confidential - Compliance Review

## Executive Summary

Compliance classifies the incident as a significant control failure requiring management attention. The event indicates weaknesses in USB enforcement, least-privilege access, export approval, and monitoring escalation. Regulatory notification workflows under GDPR and financial-sector cyber incident procedures should be activated in parallel, with a single source of truth for facts.

## Compliance Domains In Scope

- GDPR breach response
- Financial-sector cyber incident workflow
- KRITIS/NIS internal escalation assumption
- DORA incident management procedure
- PCI DSS and payment-card handling controls
- Access governance
- Insider-risk controls
- Evidence and audit trail completeness

## Control Observations

| Control Area | Observation | Compliance Impact |
|---|---|---|
| USB control | DLP monitored but did not block write. | Control design may be insufficient for PAN data. |
| Least privilege | Group export rights allowed broad CSV export. | Access entitlement requires review. |
| Four-eyes approval | No second approval for PAN export. | Missing preventive control. |
| Data minimisation | Export included full PAN where masked PAN may have sufficed. | Data minimisation issue. |
| Audit logging | Portal, DLP, EDR logs available. | Positive evidence position. |
| Incident escalation | SysAdmin escalated quickly. | Positive response position. |
| Legal hold | Needs formal confirmation. | Required for defensible audit trail. |

## Required Evidence Pack

Compliance requests the following artefacts before final sign-off:

- DLP event package
- EDR timeline export
- Portal audit log for export job
- Database query or export metadata
- Access group membership history
- USB control policy in force at incident time
- Exception register for Payment Operations VDI
- HR employment status confirmation
- Badge access and CCTV preservation confirmation
- Card processor notification decision
- Authority notification draft and final version
- Customer communication draft and final version
- CISO decision record
- Management body notification record

## Regulatory Workflow Assessment

GDPR:

- DPO has assessed GDPR applicability and notifiability.
- Compliance agrees that authority notification should be prepared immediately.
- Data-subject communication is likely required based on high-risk factors.

Financial-sector incident workflow:

- Treat as potentially reportable until Legal and Compliance confirm thresholds.
- Record rationale if any financial-sector notification is not made.
- Align facts with DORA/NIS/KRITIS internal incident taxonomy.

Payment-card obligations:

- Payment processor and card-scheme obligations must be checked.
- Full PAN exposure may trigger contractual reporting and remediation duties.
- PCI DSS control review should be opened.

## Audit Trail Requirements

Every decision should capture:

- Decision owner
- Timestamp
- Source facts relied on
- Alternatives considered
- Reason for chosen action
- Follow-up owner
- Deadline

The ISO should maintain a versioned incident fact sheet to prevent conflicting statements across Legal, DPO, Compliance, Communications, and CISO.

## Compliance Recommendations

Immediate:

1. Activate regulatory notification workflow.
2. Record CISO decision in the tool.
3. Freeze current evidence and access-control state.
4. Notify management body using the internal major incident template.
5. Check contractual reporting thresholds with payment processor.

Within 24 hours:

1. Complete access recertification for Payment Operations export permissions.
2. Confirm USB write-blocking for all high-risk VDI pools.
3. Implement emergency export approval for PAN-containing reports.
4. Document customer mitigation options.

Post-incident:

1. Replace full PAN exports with masked or tokenised reports where possible.
2. Add just-in-time approval for sensitive exports.
3. Add alert-to-block behaviour for high-confidence PAN exfiltration events.
4. Update insider-risk playbook and tabletop exercise materials.

## Compliance Sign-Off Position

Compliance cannot sign off closure until authority notification, data-subject communication decision, payment-card partner assessment, evidence preservation, and control remediation owners are documented.

