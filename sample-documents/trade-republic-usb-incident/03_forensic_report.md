# Forensic Report

Document type: Digital forensics and incident response report
Role: IT-Sec
Incident ID: TR-USB-2026-04-26-001
Created: 2026-04-26 10:40 CEST
Status: Interim report
Classification: Confidential - Legal Hold

## Executive Summary

Forensic evidence supports the conclusion that the user `trb\mkeller` exported customer payment-card reconciliation data and copied it to an unauthorised USB storage device. The file copy completed successfully. The USB device has not been recovered. There is currently no evidence of external network exfiltration, malware, lateral movement, or compromise of other accounts.

The incident is best characterised as malicious or unauthorised insider data exfiltration using removable media.

## Scope of Examination

Examined assets:

- VDI image of BER-VDI-PAYOPS-014
- Microsoft Defender for Endpoint timeline
- DLP event package
- Payment Reconciliation Portal audit logs
- AD, SSO, VPN, and badge access logs
- Proxy and DNS logs for the user session
- Email and Teams audit logs for the user

Not yet examined:

- Employee personal devices
- The USB device itself
- Personal cloud accounts
- Private messaging channels

## Key Findings

1. The export job completed at 05:41 CEST and generated 18,742 rows.
2. The file was copied to removable storage at 05:43 CEST.
3. Windows shell artefacts show the USB volume label `MK_BACKUP_64`.
4. The local copy was deleted at 05:46 CEST, but the deletion occurred after the USB copy completed.
5. The VDI recycle bin was emptied.
6. No malware was detected on the VDI.
7. No unusual administrator activity was observed.
8. No outbound upload to common cloud storage was found in proxy logs during the examined window.
9. The employee left the office after the copy and before security could intercept the device.

## Evidence Table

| Evidence ID | Source | Finding |
|---|---|---|
| E-001 | DLP event package | Copy to unauthorised USB detected and completed. |
| E-002 | VDI USN journal | CSV created, copied, then deleted locally. |
| E-003 | Shellbags and registry | USB serial and volume label recorded. |
| E-004 | Portal audit log | Export job by `trb\mkeller`, 18,742 rows. |
| E-005 | EDR timeline | No malware, no suspicious parent process. |
| E-006 | Proxy logs | No confirmed network upload from VDI. |
| E-007 | Badge logs | Employee exited at 06:12 CEST. |

## Data Scope

Maximum confirmed scope from export metadata:

- 18,742 customer records
- 17,986 German residents
- 421 Austrian residents
- 335 residents in other EU/EEA countries
- 18,742 full names
- 18,742 email addresses
- 17,903 mobile numbers
- 18,742 postal addresses
- 18,742 payment-card PANs
- 18,742 card expiry dates
- 18,742 card token mapping IDs
- 18,742 account status values

No CVV, PIN, password hashes, MFA secrets, securities holdings, or full IBANs were present in the export based on schema review.

## Attack Technique

Primary technique: data exfiltration to removable media.

Contributing control gaps:

- USB policy was monitor-only for Payment Operations VDI.
- CSV export entitlement was broader than operationally required.
- Export approval workflow did not require second-person approval for PAN-containing fields.
- DLP detected the event but did not block the copy.

## Containment and Preservation

Completed:

- User account disabled.
- VDI isolated and preserved.
- Export entitlement removed from Payment Operations group.
- USB write policy switched to block for Payment Operations VDI pool.
- DLP event package exported to case vault.
- Hashes recorded for generated CSV and VDI image.

Recommended next actions:

- Preserve badge, CCTV, HR, and communication records under legal hold.
- Seek voluntary return of USB through HR/Legal channel.
- Prepare criminal complaint if device is not returned immediately.
- Ask card processor whether PAN replacement or card monitoring is required.
- Search for the file hash and filename across endpoints, mailboxes, Teams, SharePoint, OneDrive, and proxy logs.

## Forensic Confidence

Confidence that the CSV was copied to the USB device: High.

Confidence in exact customer count: Medium-high. Export metadata is reliable, but deduplication and customer-status reconciliation are still pending.

Confidence that no onward disclosure occurred: Low. Absence of network exfiltration from company systems does not rule out later use from the USB device.

## IT-Sec Recommendation

Proceed on the assumption that confidentiality of the exported personal and payment-card data has been lost. The inability to recover the USB device and the employee's non-response materially increases risk. Notify ISO, DPO, Legal, Compliance, and CISO that the technical evidence supports regulatory notification analysis.

