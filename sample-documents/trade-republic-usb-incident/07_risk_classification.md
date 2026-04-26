# Risk Classification

Document type: GDPR and incident risk classification
Role: Legal
Incident ID: TR-USB-2026-04-26-001
Created: 2026-04-26 13:45 CEST
Status: Submitted to ISO and CISO
Classification: Confidential - Incident Response

## Classification Result

Overall incident severity: Critical.

GDPR risk to data subjects: High.

Business and regulatory risk: High.

Confidence: Medium-high, based on current forensic evidence and unresolved USB recovery.

## Classification Rationale

The incident involves suspected malicious insider exfiltration of 18,742 customer records containing full payment-card PANs and contact data. The USB device is outside company control, cannot be wiped, and has not been recovered. The combination of payment-card data and contact data creates a realistic risk of fraud, targeted phishing, social engineering, and loss of confidentiality of financial-service relationships.

## Scoring Matrix

| Factor | Rating | Rationale |
|---|---:|---|
| Data sensitivity | 5/5 | Full PAN, customer identity, contact data, transaction context. |
| Data volume | 4/5 | 18,742 customers is material. |
| Threat actor | 4/5 | Insider with business context, intent not ruled out. |
| Exposure certainty | 4/5 | Copy to USB confirmed; onward disclosure unknown. |
| Mitigation control | 2/5 | Account disabled quickly, but USB not recoverable remotely. |
| Customer harm potential | 5/5 | Payment fraud and targeted phishing plausible. |
| Regulatory scrutiny | 5/5 | Financial-services context and payment data. |

Weighted classification: Critical operational incident with high GDPR risk.

## GDPR Notification Risk Level

Legal classification: likely high risk to rights and freedoms of natural persons.

Factors supporting high risk:

- Full PAN and expiry date were included.
- Direct contact data was included.
- The suspected recipient is not authorised.
- The device is not encrypted by company controls.
- No deletion assurance exists.
- Potential harm includes financial fraud and social engineering.

Factors that reduce but do not eliminate risk:

- CVV and PIN were not included.
- Passwords and MFA secrets were not included.
- No evidence of public leak yet.
- Card processor mitigation may reduce fraud risk.

## NIS/KRITIS/DORA Incident Relevance

Working classification for internal workflow: NIS/KRITIS/DORA-relevant security incident requiring compliance review.

Reasoning:

- The organisation operates in the financial sector.
- The incident involves network and information systems supporting card operations.
- Confidentiality of customer payment data is affected.
- The incident may have significant reputational and regulatory impact even without service outage.

Final external classification should be confirmed by Compliance and Legal against current statutory and contractual thresholds.

## Suggested Severity Label in Tool

Recommended tool severity: `critical`.

Recommended phase: `assessment` until CISO notification decision is recorded.

Recommended next phase after CISO decision: `notification`.

## Decision Recommendation

The CISO should choose `notify` for supervisory authority notification. Customer communication should be prepared and likely sent unless card processor analysis materially changes the risk profile.

## Open Risk Items

- Whether all PANs were active at time of export.
- Whether emergency card blocking or replacement is proportionate.
- Whether any exported customers are minors or vulnerable individuals.
- Whether the employee accessed the file before or after leaving the office.
- Whether the USB data has been uploaded or transferred onward.

