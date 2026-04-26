# Legal Assessment

Document type: Legal assessment
Role: Legal
Incident ID: TR-USB-2026-04-26-001
Created: 2026-04-26 13:20 CEST
Status: Submitted to ISO, DPO, CISO
Classification: Confidential - Attorney Work Product

## Scope

Legal reviewed the preliminary incident facts, SysAdmin report, DPO GDPR applicability assessment, DPO notifiability assessment, and IT-Sec interim forensic report.

This assessment addresses:

- GDPR applicability
- Notification posture
- Employment-law and criminal-law options
- Regulatory and contractual exposure
- Privilege and evidence preservation
- Recommended legal next steps

## Summary Legal Position

The incident should be treated as a personal data breach with high regulatory and litigation relevance. The facts support a conservative notification posture. Legal recommends notifying the competent data protection supervisory authority, preparing data-subject communication, and preserving all evidence under legal hold.

## GDPR Applicability

Legal agrees with the DPO that GDPR applies. The dataset contains personal data of customers and was processed in the context of financial services. The unauthorised copy to a personal or unmanaged USB device is a confidentiality breach.

Legal also agrees that the incident likely meets the threshold for notification to the supervisory authority and likely meets the high-risk threshold for customer communication.

## Risk Drivers

- Full payment-card PANs are included.
- Contact details and financial context are combined.
- The suspected actor is an employee with operational knowledge.
- The USB device is missing.
- The organisation cannot remotely wipe or verify deletion.
- The affected population is large enough to create regulatory scrutiny.
- The incident involves a financial-services environment.

## Regulatory Considerations

Potential regulatory workflows to coordinate:

- GDPR personal data breach notification.
- Financial-sector ICT incident reporting workflow under the organisation's DORA/NIS/KRITIS procedure.
- Payment-card scheme and processor notification if required by contract.
- Internal compliance escalation to management body.
- Possible law-enforcement referral.

The reporting posture should avoid inconsistent facts across channels. ISO should maintain a single incident fact sheet and versioned notification summary.

## Employment-Law and Criminal-Law Considerations

Recommended immediate actions:

1. Maintain suspension of system access.
2. Issue written preservation and return demand to the employee.
3. Invite employee to immediate fact-finding meeting with HR and Legal.
4. Demand return of the USB device and any copies.
5. Preserve CCTV, badge, email, chat, endpoint, and HR records.
6. Prepare criminal complaint if the device is not returned immediately or if intent is confirmed.
7. Avoid defamatory internal communication; describe the case as suspected unauthorised exfiltration until final findings.

## Customer Contract and Liability Considerations

Potential exposure:

- Customer claims for harm caused by card fraud or phishing.
- Complaints to supervisory authorities.
- Contractual claims from payment partners or processors.
- Audit findings regarding access control and DLP configuration.
- Reputational harm from perceived weak insider-risk controls.

Risk mitigation:

- Offer clear guidance and support to affected customers.
- Coordinate card-protection measures with processor.
- Keep a precise audit trail of decisions.
- Do not overstate certainty where facts remain under investigation.

## Privilege and Documentation

Legal recommends:

- Mark legal strategy notes as confidential attorney work product.
- Keep technical facts separate from legal advice.
- Preserve original logs in immutable storage.
- Use version-controlled incident summaries.
- Record who approved each notification decision and when.

## Recommended Legal Decision

Legal recommends the CISO and management decide to notify the supervisory authority and prepare affected-customer communication. Legal also recommends parallel preparation of a law-enforcement complaint and contractual notifications to relevant payment partners, subject to final review of contractual thresholds.

## Open Legal Questions

- Confirm lead supervisory authority for this incident.
- Confirm whether any customers outside Germany require local authority coordination.
- Confirm contractual notification timeframes with card processor and payment partners.
- Confirm whether final data-subject communication should include an offer of card replacement or monitoring.
- Confirm whether employment-law steps require works council involvement.

