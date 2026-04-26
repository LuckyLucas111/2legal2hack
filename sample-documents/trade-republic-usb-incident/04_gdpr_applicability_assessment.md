# GDPR Applicability Assessment

Document type: GDPR applicability assessment
Role: DPO
Incident ID: TR-USB-2026-04-26-001
Created: 2026-04-26 11:15 CEST
Status: Submitted to ISO and Legal
Classification: Confidential - DPO Work Product

## Question Presented

Does GDPR apply to the incident involving unauthorised copying of customer payment-card reconciliation data to a USB storage device?

## Short Answer

Yes. GDPR applies. The incident involves personal data of identifiable natural persons processed by Trade Republic in the context of customer financial services. The unauthorised export and suspected loss of confidentiality constitute a personal data breach for GDPR incident-management purposes.

## Controller and Processing Context

Working assumption: Trade Republic Bank GmbH is the controller for customer identity, account, and payment-card reconciliation data used to provide financial services and manage payment-card operations.

Relevant processing context:

- Customer onboarding and account servicing
- Payment-card issuing and reconciliation
- Fraud and transaction monitoring
- Customer support and operational reconciliation

## Personal Data Assessment

The exported dataset contains personal data because records can identify natural persons directly or indirectly.

Personal data fields:

- Full name
- Email address
- Mobile number
- Postal address
- Customer ID
- Account status
- Last transaction timestamp
- Payment-card PAN and expiry
- Card token mapping ID linked to customer identity
- Risk flags linked to transactions and account behaviour

The dataset does not appear to include special categories of personal data under GDPR Art. 9. It does include financial and payment-card data, which materially increases risk because misuse may enable fraud, phishing, social engineering, and financial harm.

## Breach Type

Confidentiality breach: Yes.

Integrity breach: Not currently indicated.

Availability breach: No service availability impact currently indicated.

The core breach is unauthorised disclosure or unauthorised access risk caused by copying personal data to non-company removable media outside organisational control.

## Data Subjects

Preliminary affected population:

- 18,742 customers
- Mostly German residents, with a smaller number of Austrian and other EU/EEA residents
- All appear to be natural persons using retail financial services

## GDPR Relevance

The GDPR is applicable because:

1. The data relates to identified or identifiable natural persons.
2. The organisation processes the data in the context of its EU establishment.
3. The incident concerns unauthorised disclosure or access risk.
4. The suspected recipient is not authorised to hold or use the data outside company systems.

## Initial Risk Factors

Risk-increasing factors:

- Full PAN included.
- Contact data enables targeted phishing.
- Data subjects are financial-services customers.
- Insider intent cannot be ruled out.
- USB is not recovered.
- Number of affected data subjects is material.
- Data was copied to an unmanaged device, so no technical control can verify deletion.

Risk-reducing factors:

- CVV and PIN are not present.
- Passwords and MFA secrets are not present.
- No evidence of public posting or sale at this time.
- The customer-facing service remains available.
- The employee account was disabled quickly.

## DPO Conclusion

GDPR applies. This should be treated as a personal data breach involving loss of confidentiality for customer financial and payment-card data.

The DPO should proceed immediately to notifiability analysis under GDPR Art. 33 and Art. 34, using 2026-04-26 06:05 CEST as the current awareness timestamp unless Legal and ISO agree on a different documented awareness time.

