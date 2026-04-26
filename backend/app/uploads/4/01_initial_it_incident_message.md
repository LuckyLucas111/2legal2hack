# Initial IT-Incident Message

Document type: Initial IT incident message
Role: SysAdmin
Incident ID: TR-USB-2026-04-26-001
Created: 2026-04-26 06:18 CEST
Status: Sent to ISO, IT-Sec, DPO, Legal, Compliance
Classification: Confidential - Incident Response

## Summary

At 05:43 CEST on 2026-04-26, endpoint DLP raised a critical alert for workstation BER-VDI-PAYOPS-014. The alert indicates that employee Moritz Keller copied a CSV export named `card_recon_export_2026-04-26_0541.csv` to an unauthorised USB mass-storage device.

Preliminary log review indicates the CSV was exported from the payment-card reconciliation read replica and contains personal data and payment-card data for approximately 18,742 customers.

The employee left the Berlin office at 06:12 CEST. The USB device has not been recovered. The employee account was disabled at 06:16 CEST.

## Immediate Facts

- Detected by: Microsoft Defender for Endpoint DLP rule `USB_BLOCK_PAYMENT_DATA_HIGH`
- Detection time: 2026-04-26 05:43 CEST
- Awareness time proposed for GDPR clock: 2026-04-26 06:05 CEST
- Workstation: BER-VDI-PAYOPS-014
- User: `trb\mkeller`
- Department: Payment Operations
- File name: `card_recon_export_2026-04-26_0541.csv`
- File size: 14.8 MB
- Approximate records: 18,742
- USB serial: `SNDK-ULTRA-64G-4C530001230417118305`
- USB vendor/product: SanDisk Ultra Fit 64 GB
- USB encryption status: Unknown, not company-managed
- Employee access status: Disabled
- Service impact: None observed

## Suspected Data Categories

- Customer ID
- Full name
- Email address
- Mobile number
- Postal address
- IBAN last 4 digits
- Card product type
- Full payment-card PAN
- Expiry month and year
- Card token mapping ID
- Last transaction timestamp
- Transaction risk flags
- Account status

The export does not appear to contain CVV, PIN, passwords, MFA secrets, seed phrases, or full IBAN.

## Initial Severity

Initial technical severity: Critical.

Reasoning:

- Confirmed copy to unauthorised removable media.
- Full PANs appear to be included.
- Device is outside company custody.
- Insider intent cannot be ruled out.
- Affected number of customers is material.
- No evidence yet that data has been sold, posted, or otherwise disclosed onward.

## Immediate Actions Taken

- Disabled AD and SSO account `trb\mkeller`.
- Revoked active sessions for SSO, VPN, admin portal, and payment operations tools.
- Isolated workstation BER-VDI-PAYOPS-014 from the network.
- Preserved EDR timeline and DLP event package.
- Requested badge access logs and CCTV from Physical Security.
- Notified ISO by phone at 06:08 CEST.
- Opened incident ticket `IR-2026-04-26-017`.

## Requests to ISO

Please dispatch urgent tasks:

1. IT-Sec: Forensic validation, exfiltration scope, and chain-of-custody report.
2. DPO: GDPR applicability and notifiability assessment.
3. Legal: GDPR risk classification, employment-law action, and criminal complaint evaluation.
4. Compliance: KRITIS/NIS/DORA and PCI control impact assessment.
5. Communications: Prepare holding lines for internal and customer-facing communication.
6. CISO: Prepare notification decision once DPO and Legal inputs are available.

## Open Questions

- Was the CSV opened after copy or copied again to another system?
- Does the employee possess other unauthorised exports?
- Are any affected cards active and usable without additional controls?
- Does tokenisation reduce misuse risk for any records?
- Which supervisory authority and financial-sector reporting channel should receive first notice?

