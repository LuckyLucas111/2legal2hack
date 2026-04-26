MOCK_RESPONSES = {
    "kb_chat": (
        "Based on the uploaded incident documents, the following key findings are relevant:\n\n"
        "**Technical Assessment:**\n"
        "The incident involves unauthorized access to internal systems through a compromised USB device. "
        "Forensic analysis indicates that the device contained malware capable of exfiltrating data from connected systems. "
        "The affected systems include the internal file server and the CRM database.\n\n"
        "**Data Protection Impact:**\n"
        "Personal data of approximately 15,000 customers was potentially exposed, including names, email addresses, "
        "and account identifiers. No financial data (credit card numbers, bank details) appears to have been accessed "
        "based on current forensic findings.\n\n"
        "**Regulatory Implications:**\n"
        "Under GDPR Art. 33, this incident likely meets the threshold for notification to the supervisory authority "
        "within 72 hours, as there is a risk to the rights and freedoms of natural persons. "
        "The NIS2 Directive may also apply if the organization is classified as an essential or important entity.\n\n"
        "**Recommended Next Steps:**\n"
        "1. Complete the forensic investigation to determine the exact scope of data exposure\n"
        "2. Prepare the GDPR Art. 33 notification to the supervisory authority\n"
        "3. Assess whether Art. 34 notification to affected individuals is required\n"
        "4. Document all containment measures taken"
    ),

    "report_generation": (
        "# Incident Response Report\n\n"
        "## 1. Executive Summary\n\n"
        "This report documents a cybersecurity incident involving unauthorized data access through a compromised USB storage device. "
        "The incident was detected on the reporting date and immediately escalated to the incident response team. "
        "Preliminary assessment indicates potential exposure of personal data falling under GDPR protection, "
        "necessitating regulatory notification procedures.\n\n"
        "## 2. Incident Description & Timeline\n\n"
        "The incident originated from an unauthorized USB device connected to a workstation within the internal network. "
        "The device contained sophisticated malware designed to enumerate network resources and exfiltrate sensitive data. "
        "Upon detection by the endpoint security system, the affected workstation was immediately isolated from the network.\n\n"
        "**Key Timeline Events:**\n"
        "- Initial compromise detected by endpoint monitoring\n"
        "- Incident response team activated\n"
        "- Affected systems isolated from network\n"
        "- Forensic investigation initiated\n"
        "- Preliminary scope assessment completed\n\n"
        "## 3. Impact Assessment\n\n"
        "### Data Categories Affected\n"
        "- Customer identification data (names, email addresses)\n"
        "- Account identifiers and service metadata\n"
        "- Internal system access logs\n\n"
        "### Individuals Affected\n"
        "Approximately 15,000 customer records were potentially accessible during the incident window. "
        "The exact number of affected individuals is subject to ongoing forensic analysis.\n\n"
        "### Potential Harm\n"
        "The exposed data could be used for targeted phishing campaigns, identity fraud, "
        "or unauthorized account access. The risk level is assessed as **high** given the volume "
        "and nature of the data involved.\n\n"
        "## 4. Regulatory Analysis\n\n"
        "### GDPR Obligations\n"
        "- **Art. 33 (Notification to supervisory authority):** Required within 72 hours of awareness. "
        "The incident constitutes a personal data breach likely to result in a risk to natural persons' rights and freedoms.\n"
        "- **Art. 34 (Communication to data subjects):** Likely required given the high risk to affected individuals. "
        "Assessment pending completion of forensic investigation.\n\n"
        "### NIS2 Obligations\n"
        "- **Early warning:** Required within 24 hours if the organization falls under NIS2 scope.\n"
        "- **Incident notification:** Full report required within 72 hours.\n"
        "- **Final report:** Due within one month of the incident notification.\n\n"
        "## 5. Actions Taken\n\n"
        "- Immediate network isolation of affected systems\n"
        "- Forensic preservation of evidence\n"
        "- Engagement of external cybersecurity specialists\n"
        "- Activation of incident response procedures\n"
        "- Internal stakeholder notification\n\n"
        "## 6. Notification Decision & Rationale\n\n"
        "Based on the preliminary assessment, notification to the competent supervisory authority under "
        "GDPR Art. 33 is **recommended**. The incident involves a confirmed personal data breach with "
        "potential risk to data subjects. Delaying notification would not be justified under the current circumstances.\n\n"
        "## 7. Recommendations & Next Steps\n\n"
        "1. **Immediate:** File GDPR Art. 33 notification with the supervisory authority\n"
        "2. **Short-term:** Complete forensic investigation and determine exact data exposure scope\n"
        "3. **Short-term:** Prepare Art. 34 communication to affected individuals\n"
        "4. **Medium-term:** Conduct root cause analysis and implement additional security controls\n"
        "5. **Long-term:** Review and update USB device policies and endpoint security measures\n"
    ),

    "ai_suggestions": [
        {
            "title": "Classify incident severity",
            "description": "The incident severity has not been classified yet. A severity classification is essential for determining the urgency of response actions and regulatory notification timelines. Please assess the severity based on the scope of data exposure, the sensitivity of affected data categories, and the potential impact on affected individuals.",
            "recommended_action": "dispatch_task",
            "target_role": "iso",
            "priority": "critical",
            "task_type": "assessment",
        },
        {
            "title": "Assess GDPR applicability",
            "description": "It has not been determined whether GDPR applies to this incident. Given the potential involvement of personal data, the DPO should assess whether GDPR Art. 4(12) breach criteria are met and document the assessment rationale.",
            "recommended_action": "dispatch_task",
            "target_role": "dpo",
            "priority": "critical",
            "task_type": "assessment",
        },
        {
            "title": "Identify affected data categories",
            "description": "The specific categories of personal data affected by this incident need to be identified and documented. This information is required for the GDPR Art. 33 notification and for assessing the risk to data subjects under Art. 34.",
            "recommended_action": "dispatch_task",
            "target_role": "dpo",
            "priority": "high",
            "task_type": "info_request",
        },
        {
            "title": "Determine number of affected individuals",
            "description": "The number of individuals whose personal data may have been compromised needs to be determined. This is a mandatory field in the GDPR Art. 33 notification to the supervisory authority.",
            "recommended_action": "dispatch_task",
            "target_role": "dpo",
            "priority": "high",
            "task_type": "info_request",
        },
        {
            "title": "Provide technical forensic findings",
            "description": "A detailed technical report of the forensic investigation findings is needed. This should include: attack vector analysis, indicators of compromise (IOCs), affected systems inventory, data flow analysis, and confirmation of containment effectiveness.",
            "recommended_action": "dispatch_task",
            "target_role": "itsec",
            "priority": "high",
            "task_type": "report",
        },
        {
            "title": "Assess NIS2 applicability",
            "description": "Determine whether the NIS2 Directive applies to this incident based on the organization's classification as an essential or important entity. If applicable, the 24-hour early warning and 72-hour notification deadlines must be tracked.",
            "recommended_action": "dispatch_task",
            "target_role": "compliance",
            "priority": "high",
            "task_type": "assessment",
        },
    ],

    "legal_summary": (
        "## Legal Briefing Summary\n\n"
        "### 1. Facts of the Incident\n\n"
        "A cybersecurity incident involving unauthorized data access through a compromised USB storage device "
        "has been reported. The incident resulted in potential unauthorized access to personal data stored "
        "on internal systems. The affected data categories include customer identification data and account metadata. "
        "Approximately 15,000 data subjects may be affected.\n\n"
        "### 2. Relevant Regulatory Framework\n\n"
        "**GDPR (Regulation (EU) 2016/679):**\n"
        "- Art. 4(12): Definition of personal data breach — the incident meets the criteria as it involves "
        "unauthorized access to personal data.\n"
        "- Art. 33(1): Notification obligation to the supervisory authority within 72 hours unless the breach "
        "is unlikely to result in a risk to natural persons' rights and freedoms.\n"
        "- Art. 33(3): Required content of the notification (nature of breach, categories/numbers of data subjects, "
        "DPO contact, likely consequences, measures taken).\n"
        "- Art. 34(1): Communication to data subjects required when the breach is likely to result in a high risk "
        "to their rights and freedoms.\n"
        "- Art. 5(1)(f): Integrity and confidentiality principle — the controller must demonstrate appropriate "
        "technical and organizational measures were in place.\n\n"
        "**NIS2 Directive (Directive (EU) 2022/2555):**\n"
        "- Art. 23(1): Significant incident reporting obligation if the organization is an essential or important entity.\n"
        "- Art. 23(4)(a): Early warning within 24 hours of becoming aware of a significant incident.\n"
        "- Art. 23(4)(b): Incident notification within 72 hours with initial assessment.\n\n"
        "### 3. Key Findings from Technical and DPO Assessments\n\n"
        "- The attack vector was a compromised USB device containing data exfiltration malware\n"
        "- Affected systems were isolated within the established response timeframe\n"
        "- Personal data exposure is confirmed but the exact scope requires further forensic analysis\n"
        "- No evidence of financial data exposure at this stage\n"
        "- Endpoint security systems detected the compromise, indicating baseline security measures were operational\n\n"
        "### 4. Open Legal Questions\n\n"
        "1. **Notification timeline:** The 72-hour GDPR Art. 33 notification deadline is running. "
        "Has the exact moment of 'awareness' been documented for the record?\n"
        "2. **Art. 34 threshold:** Does the current risk assessment support the 'high risk' threshold "
        "requiring direct communication to affected data subjects?\n"
        "3. **Cross-border implications:** Are data subjects located in multiple EU member states, "
        "potentially triggering obligations under multiple supervisory authorities?\n"
        "4. **Processor involvement:** Were any data processors involved in the processing of the affected data? "
        "If so, Art. 33(2) notification obligations apply.\n"
        "5. **Documentation under Art. 33(5):** Is a complete breach register entry being maintained "
        "with all facts, effects, and remedial actions?"
    ),
}
