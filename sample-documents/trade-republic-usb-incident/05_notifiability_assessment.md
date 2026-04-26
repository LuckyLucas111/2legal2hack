# Notifiability Assessment

Document type: GDPR notifiability assessment
Role: DPO
Incident ID: TR-USB-2026-04-26-001
Created: 2026-04-26 12:10 CEST
Status: Submitted to ISO, CISO, Legal
Classification: Confidential - DPO Work Product

## Question Presented

Does the incident require notification to the supervisory authority and communication to affected data subjects?

## Short Answer

Yes. The DPO recommends notification to the competent supervisory authority without undue delay and preparation of direct communication to affected data subjects. The facts indicate likely risk, and likely high risk, to the rights and freedoms of affected individuals.

## Awareness Time and Deadline

Recommended documented awareness time: 2026-04-26 06:05 CEST.

Reason: By 06:05 CEST, the organisation had a DLP alert, preliminary confirmation of unauthorised USB copy, file name, user identity, and data-category indicators sufficient to treat the event as a personal data breach.

GDPR 72-hour target from awareness: 2026-04-29 06:05 CEST.

The DPO recommends initial authority notification on 2026-04-26, even if some details remain preliminary, followed by updates as forensic findings mature.

## Data Categories

Likely involved:

- Identity and contact data
- Customer account identifiers
- Payment-card PAN
- Card expiry date
- Card token mapping ID
- Account status
- Transaction timestamp and risk flags

Not currently indicated:

- CVV
- PIN
- Passwords
- MFA secrets
- Seed phrases
- Securities portfolio holdings
- Full IBAN
- Special-category data

## Affected Data Subjects

Maximum currently known count: 18,742 customers.

Geographic distribution:

- Germany: 17,986
- Austria: 421
- Other EU/EEA: 335

The exact deduplicated count is pending final reconciliation.

## Likely Consequences for Data Subjects

Likely harms include:

- Card fraud or attempted card fraud
- Targeted phishing using combined contact and financial context
- Social engineering against customers or customer support
- Identity misuse
- Loss of confidentiality of financial-service relationship
- Anxiety and loss of control over personal data

Risk is elevated because full PAN and direct contact information are present together.

## Authority Notification Analysis

Authority notification is recommended because the breach is not unlikely to result in risk to rights and freedoms. It involves a material number of customers, financial data, payment-card data, and a missing unauthorised USB device.

Recommended authority-notification content:

- Nature of breach: unauthorised copy to removable media by employee
- Categories and approximate number of data subjects
- Categories and approximate number of records
- DPO contact point
- Likely consequences
- Measures taken and proposed
- Information still under investigation

## Data Subject Communication Analysis

Data-subject communication is recommended because the breach is likely to result in high risk.

Reasons:

- Full payment-card PANs were copied.
- Contact data enables convincing fraud attempts.
- The device is outside company control.
- The suspected actor is an employee with contextual knowledge.
- No confirmation of secure deletion exists.

Recommended timing: Prepare immediately, send after CISO/management decision and after coordination with card processor, Legal, Compliance, and Communications. Do not wait for perfect forensic certainty if high risk remains likely.

## Suggested Plain-Language Customer Message Elements

Affected customers should be told:

- What happened.
- What personal data categories may be affected.
- What Trade Republic has done.
- What customers should do.
- How to contact support and DPO.
- That Trade Republic will not ask for passwords, PINs, TANs, or security codes by phone or email.
- Whether card replacement, monitoring, or additional protective steps are being offered.

## DPO Recommendation

Proceed with:

1. GDPR supervisory authority notification.
2. Preparation of customer communication.
3. Card processor coordination.
4. Continued forensic investigation.
5. Documented update cycle every 12 hours until facts stabilise.

The DPO recommends CISO decision: notify.

