import React, { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Navbar from './Nav/Navbar';
import Footer from './Nav/Footer';
import BackButton from './ui/BackButton';
import Seo from './Seo';
import { blockedStatesPhrase } from '../lib/serviceArea';

/* "MD Integrations Clinician Network" is the one phrase in the legal copy that
   links out (client, 2026-09-04). Split on it rather than reaching for
   dangerouslySetInnerHTML, so legal text is never parsed as markup. */
const MDI_PHRASE = 'MD Integrations Clinician Network';
const MDI_URL = 'https://mdintegrations.com/';

const withLinks = (text) => {
  const parts = String(text).split(MDI_PHRASE);
  if (parts.length === 1) return text;
  return parts.flatMap((part, i) =>
    i === 0
      ? [part]
      : [
          <a
            key={i}
            href={MDI_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-primary underline underline-offset-2 transition-colors hover:text-accent"
          >
            {MDI_PHRASE}
          </a>,
          part,
        ]
  );
};

const legalDocuments = {
  'terms-and-conditions': {
    title: 'Terms of Service',
    lastUpdated: 'September 7, 2026',
    intro: [
      'THIS IS NOT AN EMERGENCY MEDICAL SERVICE. IF YOU ARE HAVING A MEDICAL OR PSYCHOLOGICAL EMERGENCY, PLEASE DIAL 911 OR GO TO YOUR NEAREST EMERGENCY ROOM.',
      'PLEASE READ THESE TERMS OF SERVICE CAREFULLY. These Terms of Service (the "Terms") constitute a legally binding agreement between you ("you," "your," or "User") and Nova MDK, LLC ("Nova MDK," "we," "us," or "our") governing your access to and use of the Nova MDK website, kiosks, mobile applications, and related services (collectively, the "Platform" or "Services").',
      'By accessing or using the Platform, creating an account, completing a medical intake, requesting a consultation, or purchasing any product or service through Nova MDK, you acknowledge that you have read, understood, and agree to be bound by these Terms and our Privacy Policy. If you do not agree to these Terms, you may not access or use the Platform.',
      'ARBITRATION NOTICE: These Terms contain a binding arbitration agreement and a class action waiver. By agreeing to these Terms, you agree to resolve disputes with Nova MDK through individual arbitration and waive your right to participate in class actions. Please review Section 18 (Dispute Resolution) carefully.',
    ],
    content: [
      {
        heading: '1. About Nova MDK',
        text: 'Nova MDK is a technology platform that facilitates access to telehealth medical consultations and prescription medication services. Nova MDK itself is not a medical provider, does not provide medical advice, and does not practice medicine, pharmacy, or any other licensed profession.',
        subsections: [
          {
            heading: '1.1 The Nova MDK Ecosystem',
            text: 'The Services are provided through the coordinated efforts of three distinct entities:\n\nNova MDK Platform. Nova MDK operates the Platform technology, manages customer accounts and billing, coordinates communications, and facilitates connections between Users, medical providers, and pharmacies. Nova MDK is a technology and administrative services company.\n\nIndependent Network Physicians and Clinicians ("Platform Providers" or "PG"). PG is an independent, professionally licensed medical group and network composed exclusively of physicians who hold an active Doctor of Medicine (M.D.) license in good standing in the state in which the User is located at the time of consultation (each, a "Provider"). The Platform Providers are identified below. PG does not utilize Doctors of Osteopathic Medicine (D.O.), physician assistants, nurse practitioners, or other non-M.D. clinicians to evaluate Users or issue prescriptions through the Platform. Providers affiliated with PG are responsible for evaluating Users, establishing the physician-patient relationship, making clinical decisions, issuing prescriptions when medically appropriate, and providing all medical care. The Platform Providers operate independently of Nova MDK, and Nova MDK does not control, direct, or interfere with the independent medical judgment of any Provider.\n\nThird-Party Licensed Pharmacies (the "Platform Pharmacy"). The Platform Pharmacy consists of one or more licensed pharmacies authorized to dispense prescription medications in the jurisdictions applicable to each pharmacy and prescription. Pharmacy and treatment availability may vary by state. Each Platform Pharmacy is identified below. The Platform Pharmacy is responsible for the dispensing, labeling, packaging, and shipment of prescription medications pursuant to prescriptions issued by Providers. The Platform Pharmacy operates independently in accordance with applicable federal and state pharmacy laws and regulations.\n\nThe Platform Providers and the Platform Pharmacy are independent entities that contract with Nova MDK for non-clinical administrative and technology support. Nothing in these Terms creates a partnership, joint venture, or agency relationship that would cause Nova MDK to be deemed to be practicing medicine, pharmacy, or any other licensed profession.\n\nPlatform Providers: MD Integrations Clinician Network\n\nPlatform Pharmacies: Strive Compounding Pharmacy; MediVera Compounding Pharmacy™',
          },
          {
            heading: '1.2 Contact Information',
            text: 'For general support questions, please contact us at support@novamdk.com. For medical or clinical questions, please contact medteam@novamdk.com or message your Provider through the Platform. Our mailing address is:\n\nNova MDK\n15570 Brookhurst St #238\nWestminster, CA 92683',
          },
        ],
      },
      {
        heading: '2. Eligibility and Account Registration',
        subsections: [
          {
            heading: '2.1 Eligibility',
            text: 'To use the Services, you represent and warrant that you:\n\n• Are at least 18 years of age (or the age of majority in your state of residence, whichever is greater);\n• Are physically located in the United States and in a state where the Services are available at the time of any consultation;\n• Have the legal capacity to enter into a binding contract;\n• Are using the Services for yourself, and not on behalf of another person, except as expressly authorized;\n• Will provide accurate, current, and complete information during account registration and medical intake; and\n• Are not prohibited by applicable law from receiving the Services or any product offered through the Platform.\n\nNova MDK reserves the right to refuse, suspend, or terminate access to any User who does not meet these eligibility requirements or who, in our sole discretion, may pose a risk to themselves or others.',
          },
          {
            heading: '2.1(a) Service Availability',
            // Names the states from the same constant the intake blocks on, so
            // this sentence can't promise something the form doesn't enforce.
            text: `Nova MDK currently facilitates telehealth services in all U.S. states except ${blockedStatesPhrase()}. Services are not available to patients physically located in those states.\n\nSpecific treatments and medications may be limited or unavailable in certain states based on provider licensure, pharmacy coverage, product type, and applicable law. Availability and eligibility are confirmed during the intake and clinical-review process.`,
          },
          {
            heading: '2.2 Account Registration',
            text: 'To access certain features, you must create an account. You agree to keep your login credentials confidential and to be solely responsible for all activity that occurs under your account. You agree to notify Nova MDK immediately at support@novamdk.com if you believe your account has been compromised. Each account is for a single individual. You may not share an account, sell access to your account, or allow any other person to use your account or your prescription medications.',
          },
        ],
      },
      {
        heading: '3. Nature of the Services',
        subsections: [
          {
            heading: '3.1 Telehealth Consultations',
            text: 'Through the Platform, Users may request and receive telehealth consultations with Providers affiliated with PG. Telehealth consultations may be conducted asynchronously (through written intake forms and messaging) or synchronously (through audio or video calls), as determined by the Provider and applicable law in your state.\n\nAll clinical decisions, including whether to prescribe a medication, the choice of medication, dosing, duration of therapy, and follow-up care, are made solely by the Provider in the exercise of their independent medical judgment. Nova MDK does not influence, direct, or override Provider decisions. A consultation does not guarantee that any prescription will be issued. Providers may, based on their professional judgment, prescribe medications and substances for uses that have not been reviewed or approved by the FDA, and may be experimental or investigational. Review the website Telehealth Consent for more information.',
          },
          {
            heading: '3.2 Pharmacy Services',
            text: 'If a Provider issues a prescription, the prescription may be filled by the Platform Pharmacy, by another pharmacy in Nova MDK\'s network, or, at your election where available, by a pharmacy of your choosing. Each Platform Pharmacy may dispense and ship prescription medications only in states where it is properly licensed and where the prescribed medication is permitted. Pharmacy and treatment availability varies by state.\n\nCompounded medications, if dispensed, are prepared in accordance with applicable provisions of the Federal Food, Drug, and Cosmetic Act and applicable state pharmacy laws. Compounded medications are not FDA-approved drug products and are subject to the notices and disclaimers listed on the website and labels. They are dispensed pursuant to a valid prescription based on the patient-specific clinical judgment of a Provider.',
          },
          {
            heading: '3.3 No Emergency Services',
            text: 'THE SERVICES ARE NOT INTENDED FOR MEDICAL EMERGENCIES. If you are experiencing a medical emergency, including but not limited to chest pain, difficulty breathing, severe bleeding, signs of a stroke or heart attack, suicidal ideation, or any other condition requiring immediate attention, call 911 or your local emergency services immediately, or go to the nearest emergency room. Do not use the Platform, do not message your Provider, and do not wait for a response.',
          },
          {
            heading: '3.4 Not a Replacement for Primary Care',
            text: 'The Services are designed to complement, not replace, an ongoing relationship with a primary care provider. Nova MDK strongly encourages every User to maintain a relationship with a primary care physician and to share information about consultations and medications obtained through the Platform with that provider and any other treating clinicians.',
          },
        ],
      },
      {
        heading: '4. Informed Consent to Telehealth',
        text: 'By accessing the Services and requesting a consultation, you provide your informed consent to receive healthcare services via telehealth. You acknowledge and understand the following:\n\n• Telehealth involves the use of electronic communications to enable healthcare providers at different locations to share individual patient medical information for the purpose of improving patient care.\n• The information transmitted may be used for diagnosis, treatment, follow-up, and education, and may include medical records, medical images, live video and audio, output data from medical devices, and sound and video files.\n• Telehealth has potential benefits, including more efficient evaluation and management, but also has potential risks, including, in rare cases, technical failures that could disrupt the consultation, security breaches despite reasonable safeguards, and the possibility that the absence of an in-person physical examination may, in some circumstances, lead to less complete information than an in-person visit would provide.\n• The Provider will determine whether the condition being diagnosed and/or treated is appropriate for a telehealth consultation. The Provider may, at their discretion, decline to issue a prescription, refer you to in-person care, or require additional information.\n• You have the right to withhold or withdraw consent at any time without affecting your right to future care or treatment, and you have the right to request a copy of your medical records.\n• You understand that the laws that protect the privacy and confidentiality of medical information also apply to telehealth, and no information obtained in the use of telehealth that identifies you will be disclosed without your consent except as permitted by law.\n\nBy proceeding with a consultation, you affirm that you have read this section, understand its contents, and consent to receive telehealth services on the basis described.',
      },
      {
        heading: '5. Medical Information You Provide',
        text: 'You agree to provide complete, accurate, and truthful information in any intake form, questionnaire, message, or other communication submitted through the Platform, including but not limited to your medical history, current medications, allergies, prior reactions, current symptoms, height and weight, pregnancy or lactation status, and any other information requested.\n\nProviding false, incomplete, or misleading information can result in inappropriate treatment recommendations and may seriously harm your health. If you are unsure whether information is relevant, disclose it. Nova MDK and PG reserve the right to refuse, suspend, or terminate Services to any User who provides false or materially incomplete information.\n\nYou also agree to promptly update any information that changes during the course of treatment, including new medications, new diagnoses, new symptoms, side effects, or changes in your medical condition. You may update this information through your account or by messaging medteam@novamdk.com.',
      },
      {
        heading: '6. Prescriptions',
        subsections: [
          {
            heading: '6.1 Provider Discretion',
            text: 'Issuance of a prescription is solely at the discretion of the Provider. Payment for or completion of a consultation does not entitle you to a prescription. The Provider may decline to prescribe any medication, may prescribe a different medication than the one requested, may prescribe a different dose or formulation, or may decline to issue any prescription if doing so would not, in the Provider\'s clinical judgment, be safe or medically appropriate.',
          },
          {
            heading: '6.2 Controlled Substances',
            text: 'Nova MDK Providers do not prescribe medications that are scheduled controlled substances under the U.S. Drug Enforcement Administration (DEA) schedules I through V. Requests for controlled substances will be declined.',
          },
          {
            heading: '6.3 Refills and Continuation of Therapy',
            text: 'Refills are not automatic. Continued therapy may require check-ins, follow-up consultations, lab work, or other clinical assessments at intervals determined by the Provider. Nova MDK may send reminders, but it is your responsibility to request refills in time and to provide updated information when requested.',
          },
          {
            heading: '6.4 Generic Substitution and Compounded Medications',
            text: 'Where applicable and permitted by law and the Provider\'s prescription, the Platform Pharmacy may substitute a therapeutically equivalent generic medication for a brand-name product. Where a Provider has prescribed a compounded medication, the Platform Pharmacy may dispense the compounded preparation in accordance with applicable law. You acknowledge that compounded medications are not FDA-approved drug products and that you have been informed of this fact prior to dispensing.',
          },
        ],
      },
      {
        heading: '7. Pricing, Billing, and Subscriptions',
        subsections: [
          {
            heading: '7.1 Pricing',
            text: 'Prices for consultations, products, and subscriptions are listed on the Platform. All prices are in U.S. dollars and are subject to change at any time. Applicable taxes and shipping fees, if any, will be disclosed at checkout.',
          },
          {
            heading: '7.2 Authorization to Charge',
            text: 'By providing a payment method, you authorize Nova MDK (and its payment processors) to charge that payment method for all amounts due, including consultation fees, prescription fees, recurring subscription fees, taxes, and any applicable shipping or service charges. You represent that you are authorized to use the payment method you provide.',
          },
          {
            heading: '7.3 Subscriptions and Auto-Renewal',
            text: 'Many Nova MDK offerings are sold on a subscription basis. Subscriptions automatically renew at the end of each billing cycle (monthly, quarterly, or as otherwise specified at checkout) at the then-current renewal price, until cancelled. For annual subscriptions, you will be notified no more than 45 days in advance of the upcoming renewal. You will be notified of any change of fees for a subscription between 7 to 30 days in advance of the change. By starting a subscription, you authorize Nova MDK to charge your payment method on a recurring basis without further authorization, until you cancel.',
          },
          {
            heading: '7.4 Cancellation',
            text: 'You may cancel a subscription at any time through your account or by emailing support@novamdk.com. Cancellation will take effect at the end of the then-current billing cycle. Cancellation does not entitle you to a refund of fees already paid for medications or services already shipped, dispensed, or rendered.',
          },
          {
            heading: '7.5 Refunds',
            text: 'Except where required by applicable law, all sales are final. Federal and state pharmacy laws prohibit the return of dispensed prescription medications, and we are unable to accept returned medications. Consultation fees are generally non-refundable once a Provider has reviewed your intake. Nova MDK may, in its sole discretion, issue a refund or credit on a case-by-case basis.',
          },
          {
            heading: '7.6 Insurance',
            text: 'Nova MDK is a cash-pay service. We do not bill or accept insurance for consultations, medications, or other Services. We do not generate insurance-compatible claim forms or superbills, and we make no representation that any portion of a charge is reimbursable by any insurance plan, Medicare, Medicaid, HSA, or FSA. You are solely responsible for verifying any reimbursement eligibility with your plan. Upon request from you for a scheduled service, we will provide you with a good faith estimate of expected charges for such service. You have the right to dispute the associated bill for such services if the billed amount is over $400 greater than the estimated amount.',
          },
        ],
      },
      {
        heading: '8. Shipping and Delivery',
        text: 'Prescription medications are shipped to the address you provide. You are responsible for ensuring that the shipping address is accurate and that someone is reasonably available to receive the package, and for complying with any state-specific delivery rules (for example, signature requirements). Nova MDK is not responsible for delays caused by carriers, incorrect addresses, weather, or other circumstances outside our control.\n\nRisk of loss for products passes to you upon delivery to the carrier. If a package is lost, damaged, or delivered to an incorrect address that you provided, please contact support@novamdk.com so we can investigate; remedies, if any, are at our reasonable discretion and subject to applicable law.',
      },
      {
        heading: '9. Communications and Electronic Notices',
        text: 'By creating an account, you consent to receive electronic communications from Nova MDK, the Platform Providers, and the Platform Pharmacy, including by email, SMS text message, push notification, in-Platform message, and telephone, regarding your account, medical care, prescriptions, shipments, billing, customer service, and (with separate consent where required) marketing.\n\nMessage and data rates may apply. Message frequency varies. You may opt out of marketing communications at any time using the unsubscribe link in any marketing email or by replying STOP to any marketing SMS. Transactional and clinical communications (such as prescription notifications and Provider messages) are part of the Services and cannot be opted out of while the account remains active.\n\nYou agree that any consents, agreements, disclosures, notices, and other communications that Nova MDK provides to you electronically satisfy any legal requirement that such communications be in writing.',
      },
      {
        heading: '10. Intellectual Property',
        text: 'The Platform, including all content, software, design, graphics, text, images, logos, trademarks, service marks, audio, video, and the selection and arrangement thereof (the "Platform Content"), is owned by Nova MDK or its licensors and is protected by U.S. and international copyright, trademark, and other intellectual property laws.\n\nSubject to your compliance with these Terms, Nova MDK grants you a limited, non-exclusive, non-transferable, revocable license to access and use the Platform for your personal, non-commercial use. You may not copy, modify, distribute, sell, lease, reverse engineer, scrape, frame, mirror, or create derivative works of any portion of the Platform Content without Nova MDK\'s prior written consent. "Nova MDK," the Nova MDK logo, and related marks are trademarks of Nova MDK. All other trademarks are the property of their respective owners.',
      },
      {
        heading: '11. User Content',
        text: '"User Content" means any content you submit to or through the Platform, including intake responses, photographs, messages, reviews, testimonials, and other materials, but excluding protected health information governed by our Notice of Privacy Practices.\n\nYou retain ownership of your User Content. By submitting User Content, you grant Nova MDK a worldwide, royalty-free, sublicensable, transferable license to host, store, reproduce, modify, create derivative works of, communicate, publish, publicly display, and distribute such User Content for the purpose of operating, providing, and improving the Services and, where you have separately consented, for marketing. You represent and warrant that you have all rights necessary to grant this license and that your User Content does not infringe the rights of any third party.',
      },
      {
        heading: '12. Prohibited Conduct',
        text: 'You agree that you will not, and will not attempt to:\n\n• Use the Services for any unlawful purpose or in violation of any applicable law or regulation;\n• Provide false, misleading, or incomplete information in any intake, registration, or communication;\n• Use the account, prescription, or medication of another person, or allow another person to use yours;\n• Resell, redistribute, or otherwise commercialize medications obtained through the Services;\n• Interfere with, disrupt, probe, or attempt to gain unauthorized access to the Platform, its servers, or any related systems;\n• Introduce viruses, malware, or other harmful code, or use any robot, spider, scraper, or other automated means to access the Platform without our prior written consent;\n• Harass, threaten, abuse, defame, or impersonate any Provider, Nova MDK or Platform Pharmacy staff member, or other User; or\n• Use the Platform in any manner that could disable, overburden, damage, or impair the Platform or interfere with any other party\'s use of the Platform.\n\nViolation of this Section may result in immediate suspension or termination of your account, forfeiture of any prepaid amounts (subject to applicable law), and referral to law enforcement where appropriate.',
      },
      {
        heading: '13. Third-Party Services and Links',
        text: 'The Platform may contain links to third-party websites, products, or services, and may incorporate third-party services (for example, payment processors, video conferencing, and identity verification). Nova MDK does not control and is not responsible for the content, policies, or practices of any third party. Your interactions with third parties are governed by the terms and privacy policies of those third parties. You access third-party services at your own risk.',
      },
      {
        heading: '14. Disclaimers',
        text: 'THE PLATFORM AND THE SERVICES ARE PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, NON-INFRINGEMENT, AND ANY WARRANTIES ARISING FROM COURSE OF DEALING OR USAGE OF TRADE.\n\nWithout limiting the foregoing, Nova MDK makes no warranty that: (a) the Services will meet your requirements; (b) the Services will be uninterrupted, timely, secure, or error-free; (c) the results obtained from use of the Services will be accurate or reliable; or (d) any errors in the Platform will be corrected.\n\nNova MDK is not a medical provider and does not practice medicine or pharmacy. Nova MDK makes no representation or warranty regarding the qualifications of any individual Provider beyond confirming licensure status, regarding the appropriateness of any treatment recommendation, or regarding the outcome of any consultation, medication, or course of therapy. Medical decisions are made by Providers in their independent clinical judgment, and dispensing decisions are made by the Platform Pharmacy in accordance with applicable law.',
      },
      {
        heading: '15. Limitation of Liability',
        text: 'TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, IN NO EVENT SHALL NOVAMDK, ITS AFFILIATES, OFFICERS, DIRECTORS, EMPLOYEES, AGENTS, OR LICENSORS BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, EXEMPLARY, OR PUNITIVE DAMAGES, INCLUDING WITHOUT LIMITATION DAMAGES FOR LOST PROFITS, LOST DATA, BUSINESS INTERRUPTION, OR LOSS OF GOODWILL, ARISING OUT OF OR RELATING TO YOUR USE OF, OR INABILITY TO USE, THE PLATFORM OR THE SERVICES, WHETHER BASED ON CONTRACT, TORT (INCLUDING NEGLIGENCE), STRICT LIABILITY, OR ANY OTHER LEGAL THEORY, AND WHETHER OR NOT NOVAMDK HAS BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.\n\nTO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, NOVAMDK\'S AGGREGATE LIABILITY ARISING OUT OF OR RELATING TO THESE TERMS OR THE SERVICES SHALL NOT EXCEED THE GREATER OF (A) THE TOTAL AMOUNTS PAID BY YOU TO NOVAMDK IN THE SIX (6) MONTHS PRECEDING THE EVENT GIVING RISE TO THE CLAIM, OR (B) ONE HUNDRED U.S. DOLLARS (USD $100).\n\nSome jurisdictions do not allow the exclusion or limitation of certain damages, so some of the above limitations may not apply to you. Nothing in these Terms is intended to limit liability that cannot be limited under applicable law, including liability for gross negligence, willful misconduct, or fraud.',
      },
      {
        heading: '16. Indemnification',
        text: 'You agree to defend, indemnify, and hold harmless Nova MDK, PG, the Platform Pharmacy, and each of their respective affiliates, officers, directors, employees, contractors, agents, licensors, and suppliers, from and against any and all claims, demands, actions, liabilities, losses, damages, judgments, costs, and expenses (including reasonable attorneys\' fees) arising out of or relating to: (a) your access to or use of the Services; (b) your User Content or any information you submit; (c) your breach of these Terms or any representation or warranty made by you; (d) your violation of any law or the rights of any third party; or (e) your misuse of any product or medication obtained through the Services.',
      },
      {
        heading: '17. Termination',
        text: 'You may terminate your account at any time by emailing support@novamdk.com. Nova MDK may suspend or terminate your account or access to all or part of the Services at any time, with or without cause, with or without notice, including if we reasonably believe that you have violated these Terms, posed a risk to yourself, others, or the Services, or if continued provision of the Services becomes commercially or legally impractical.\n\nUpon termination, your right to use the Services ceases immediately. Sections that by their nature should survive termination will survive, including without limitation Sections 10 (Intellectual Property), 11 (User Content), 14 (Disclaimers), 15 (Limitation of Liability), 16 (Indemnification), 18 (Dispute Resolution), and 19 (General).',
      },
      {
        heading: '18. Dispute Resolution; Arbitration; Class Action Waiver',
        text: 'PLEASE READ THIS SECTION CAREFULLY. IT AFFECTS YOUR LEGAL RIGHTS, INCLUDING YOUR RIGHT TO FILE A LAWSUIT IN COURT.',
        subsections: [
          {
            heading: '18.1 Informal Resolution',
            text: 'Before initiating any formal proceeding, you agree to first contact Nova MDK at support@novamdk.com and provide a brief written description of the dispute and your contact information. The parties shall attempt in good faith to resolve the dispute informally for at least sixty (60) days before initiating arbitration.',
          },
          {
            heading: '18.2 Binding Arbitration',
            text: 'Except for disputes that qualify for small claims court and disputes regarding intellectual property rights, any dispute, claim, or controversy arising out of or relating to these Terms or the Services (a "Dispute") that cannot be resolved informally shall be resolved through final and binding arbitration administered by JAMS pursuant to its then-current Streamlined Arbitration Rules and Procedures. The arbitration shall be conducted by a single arbitrator. The seat of the arbitration shall be Wilmington, Delaware, although the arbitration may be conducted by telephone, video, or written submissions where permitted by JAMS rules. Judgment on the award may be entered in any court of competent jurisdiction.',
          },
          {
            heading: '18.3 Class Action Waiver',
            text: 'YOU, NOVAMDK, PG, AND THE PLATFORM PHARMACY EACH AGREE THAT ANY DISPUTE BETWEEN YOU AND THE OTHER PARTIES WILL BE RESOLVED ONLY ON AN INDIVIDUAL BASIS AND NOT AS A PLAINTIFF OR CLASS MEMBER IN ANY PURPORTED CLASS, COLLECTIVE, OR REPRESENTATIVE ACTION. The arbitrator may not consolidate more than one person\'s claims and may not preside over any form of representative or class proceeding. If a court or arbitrator determines that this class action waiver is unenforceable as to any particular claim, then that claim (and only that claim) shall be severed from the arbitration and brought in a court of competent jurisdiction.',
          },
          {
            heading: '18.4 Opt-Out',
            text: 'You may opt out of the arbitration agreement and class action waiver in this Section 18 by sending written notice of your decision to opt out to support@novamdk.com within thirty (30) days after first accepting these Terms. Your notice must include your name, address, and account email and must clearly state your intent to opt out of arbitration.',
          },
          {
            heading: '18.5 Governing Law',
            text: 'These Terms and any Dispute shall be governed by and construed in accordance with the laws of the State of Delaware, without regard to its conflict-of-laws principles. Subject to Section 18.2, the state and federal courts located in New Castle County, Delaware shall have exclusive jurisdiction over any matter not subject to arbitration.',
          },
        ],
      },
      {
        heading: '19. General Provisions',
        subsections: [
          {
            heading: '19.1 Changes to These Terms',
            text: 'Nova MDK may modify these Terms at any time by posting a revised version on the Platform and updating the "Last Updated" date. Material changes will be communicated to active Users by email or in-Platform notice. Your continued use of the Services after the effective date of the revised Terms constitutes your acceptance of the revised Terms. If you do not agree to the revised Terms, you must stop using the Services.',
          },
          {
            heading: '19.2 Entire Agreement',
            text: 'These Terms, together with the Privacy Policy, the Notice of Privacy Practices, the Telehealth Consent, and any other policies or terms expressly incorporated by reference, constitute the entire agreement between you and Nova MDK regarding the Services and supersede all prior or contemporaneous understandings.',
          },
          {
            heading: '19.3 Severability',
            text: 'If any provision of these Terms is held to be invalid, illegal, or unenforceable, that provision shall be modified to the minimum extent necessary to make it enforceable, and the remaining provisions shall continue in full force and effect.',
          },
          {
            heading: '19.4 No Waiver',
            text: 'No waiver of any term of these Terms shall be deemed a further or continuing waiver of such term or of any other term. Nova MDK\'s failure to assert any right or provision under these Terms shall not constitute a waiver.',
          },
          {
            heading: '19.5 Assignment',
            text: 'You may not assign or transfer these Terms or any of your rights or obligations under them without Nova MDK\'s prior written consent. Nova MDK may assign these Terms without restriction. Any prohibited assignment is void.',
          },
          {
            heading: '19.6 Force Majeure',
            text: 'Nova MDK shall not be liable for any failure or delay in performance caused by circumstances beyond our reasonable control, including without limitation acts of God, natural disasters, war, terrorism, civil unrest, labor disputes, government action, public health emergencies, supply-chain disruptions, internet outages, or carrier delays.',
          },
          {
            heading: '19.7 Headings and Interpretation',
            text: 'Headings are for convenience only and do not affect interpretation. "Including" means "including without limitation." References to days are calendar days unless otherwise specified.',
          },
          {
            heading: '19.8 Contact',
            text: 'Questions about these Terms? Contact us at:\n\nNova MDK\nAttn: Legal\n15570 Brookhurst St #238\nWestminster, CA 92683\nEmail: support@novamdk.com\nMedical: medteam@novamdk.com',
          },
        ],
      },
    ],
    closing: 'If you are experiencing negative side effects or other adverse reactions to treatment received through the services, message your provider. You may also report the adverse reaction to FDA MedWatch to support public health efforts.\n\nBy using the Services, you acknowledge that you have read these Terms, understand them, and agree to be bound by them.',
  },

  'privacy-policy': {
    title: 'Privacy Policy',
    lastUpdated: 'September 7, 2026',
    intro: [
      'This Privacy Policy describes how Nova MDK ("Nova MDK," "we," "us," or "our") collects, uses, shares, and protects information in connection with our website, mobile applications, and related services (collectively, the "Platform" or "Services"). This Privacy Policy applies to information we collect as the operator of the Platform.',
      'IMPORTANT — Two Different Privacy Frameworks. Nova MDK operates a technology platform that facilitates connections between Users and (i) a network of independent physicians and other clinicians licensed in the jurisdictions where they provide care ("Platform Providers"), and (ii) third-party pharmacies licensed to provide pharmacy services in the jurisdictions applicable to each pharmacy and prescription ("Platform Pharmacies"). The Platform Providers and Platform Pharmacies are identified below.',
      'Information you provide directly to any Platform Provider or any Platform Pharmacy as part of your medical care — your medical history, intake answers, prescriptions, lab results, and clinical communications with your doctor — is protected health information ("PHI") governed by the federal Health Insurance Portability and Accountability Act ("HIPAA") and is described in the Platform Provider\'s separate Notice of Privacy Practices. This Privacy Policy describes our handling of non-PHI personal information collected through the Platform, such as account, contact, payment, device, and marketing data.',
      'By accessing or using the Platform, you acknowledge that you have read and understood this Privacy Policy. If you do not agree with our practices, please do not use the Platform.',
      'Platform Providers: MD Integrations Clinician Network\nPlatform Pharmacies: Strive Compounding Pharmacy; MediVera Compounding Pharmacy™',
    ],
    content: [
      {
        heading: '1. Scope of This Policy',
        text: 'This Privacy Policy applies to information we collect:\n\n• On the Nova MDK website and any subdomain operated by Nova MDK;\n• Through any Nova MDK mobile application;\n• Through email, text message, telephone, or other electronic communications between you and Nova MDK; and\n• Through any third-party platforms, advertising networks, or social-media features that direct you to or from the Platform.\n\nThis Privacy Policy does not apply to information collected by:\n\n• The Platform Provider or its clinicians in their capacity as healthcare providers (governed by the Platform Provider\'s Notice of Privacy Practices and HIPAA);\n• Each Platform Pharmacy as a licensed pharmacy (governed by HIPAA, applicable state pharmacy laws, and the Platform Pharmacy Notice of Privacy Practices);\n• Any third-party website, application, or service that the Platform may link to; or\n• Information collected offline or through any channel other than the Platform.',
      },
      {
        heading: '2. Information We Collect',
        text: 'The personal information we collect depends on how you interact with us, the Services you use, and the choices you make. We collect information from four categories of sources: information you provide to us directly, information collected automatically when you use the Platform, information from third-party data sources, and information we infer or generate from other data.',
        subsections: [
          {
            heading: '2.1 Information You Provide Directly',
            text: 'When you create an account, complete a medical intake, contact customer support, or otherwise interact with the Platform, you may provide us with:\n\n• Identity and contact information — name, email address, telephone number, billing address, and shipping address.\n• Demographic data — date of birth, sex, gender, and ZIP code.\n• Account credentials — username, password, and security questions.\n• Biometric Information — photographs, face scans, body composition measurements, or other physiological data collected through your device or a Nova MDK Smart Kiosk (see Section 2.5 for more details).\n• Payment information — credit or debit card number, expiration date, CVV, and billing ZIP. Payment card data is collected and processed by PCI-compliant third-party payment processors; Nova MDK does not store full card numbers on our servers.\n• Government-issued identification — where required to verify identity, age, or eligibility, a photograph of a driver\'s license or other government ID.\n• Marketing preferences — your communication preferences and engagement with our marketing.\n• Customer support communications — messages you send to support@novamdk.com, chat transcripts, and call recordings (where lawful and disclosed).\n\nNote on medical information: Information you submit through tests and labs, medical intake forms, messages with your Provider, and other clinical communications is collected on behalf of the Platform Providers and is treated as PHI under HIPAA. Such information is governed by the Platform Provider Notice of Privacy Practices, not this Privacy Policy.',
          },
          {
            heading: '2.2 Information Collected Automatically',
            text: 'When you visit or use the Platform, we and our service providers automatically collect certain information about your device and how you interact with the Services:\n\n• Device data — IP address, device identifiers (such as MAC address or advertising IDs), device type, operating system, browser type and version, language settings, and screen resolution.\n• Usage data — pages and screens you view, links you click, time spent on pages, referring and exit URLs, search terms, dates and times of access, and other interaction data.\n• Approximate location — general geographic location derived from IP address; we do not collect precise GPS location unless you affirmatively grant permission through your device.\n• Cookies and similar technologies — see Section 6 below for a detailed description.',
          },
          {
            heading: '2.3 Information from Third-Party Sources',
            text: 'We may receive information about you from third parties, including:\n\n• Identity-verification services that help us confirm you are who you say you are;\n• Fraud-prevention services that help us detect and prevent unauthorized account activity;\n• Analytics and advertising partners that provide aggregated data and audience information;\n• Social-media platforms, if you choose to log in or interact with us through them; and\n• Publicly available sources, such as public records and professional directories.',
          },
          {
            heading: '2.4 Information We Infer or Generate',
            text: 'We may generate or infer information about you by combining or analyzing information from the sources described above. For example, we may infer general interests from the content you view on the Platform, or we may estimate engagement levels from your activity history. We use these inferences for the purposes described in Section 3.',
          },
          {
            heading: '2.5 Biometric Information',
            text: 'Depending on how you use the Platform, we may collect biometric information, which may include: (a) a photograph of your government-issued identification and, where used to confirm that photograph matches you, a facial scan or facial geometry data, collected for identity verification; and (b) body-composition measurements, facial images, or other physiological data collected through a Nova MDK Smart Kiosk.\n\nWe collect biometric information only with your knowledge, for the specific purposes described above, and do not sell biometric information or use it for facial recognition marketing. Where required by applicable law (including biometric privacy laws in Illinois, Texas, Washington, and other states), we will: obtain your consent before collecting biometric information; use it only for the stated purpose and any purpose you separately authorize; store it using reasonable safeguards at least as protective as those used for other sensitive information; and retain it only for as long as necessary to fulfill the purpose for which it was collected, after which we will securely destroy it, unless a longer retention period is required by law or an ongoing business relationship (such as active treatment) continues.\n\nWe do not disclose biometric information to third parties except: to service providers who process it on our behalf and under confidentiality obligations; where you have separately consented; or where required by law.',
          },
        ],
      },
      {
        heading: '3. How We Use Information',
        text: 'We use the information we collect for the following purposes:\n\n• Provide the Services — create and manage your account, route requests to the Platform Providers and the Platform Pharmacies, process payments, ship products, and respond to inquiries.\n• Communicate with you — send transactional notifications (such as order confirmations, shipping updates, prescription notifications, appointment reminders, and account alerts), respond to support requests, and — with your consent where required — send marketing.\n• Improve and personalize — understand how Users interact with the Platform, develop new features, troubleshoot bugs, and tailor content and offerings to you.\n• Marketing and advertising — deliver advertisements about Nova MDK on third-party platforms, measure the effectiveness of our marketing, and (where you have consented or where permitted by law) build audiences for advertising. We do not use information you submit to your Provider or PHI for advertising.\n• Security and fraud prevention — verify identity, detect and prevent fraud, abuse, and unauthorized access, and enforce our Terms of Service.\n• Legal and compliance — comply with applicable laws, regulations, and lawful requests from government and regulatory authorities, and protect the rights, property, or safety of Nova MDK, our Users, or others.\n• Aggregated and de-identified analysis — create aggregated and de-identified data sets that no longer identify you and that we may use and disclose for any lawful purpose, including business analytics and research.',
      },
      {
        heading: '4. How We Share Information',
        text: 'We share personal information only as described in this Privacy Policy. We do not sell PHI. The categories of recipients with whom we may share non-PHI personal information are:\n\n• The Platform Providers and the Platform Pharmacies — We share information with the Platform Providers and the Platform Pharmacies as needed to facilitate your medical consultations, prescriptions, and pharmacy services. Once shared with any Platform Provider or any Platform Pharmacy for clinical or pharmacy purposes, such information becomes PHI governed by HIPAA and the recipient\'s Notice of Privacy Practices.\n• Service providers — Third-party vendors who perform services on our behalf, including hosting and cloud infrastructure, payment processing, identity verification, customer support, email and SMS delivery, analytics, fraud prevention, shipping carriers, and IT support. These vendors are contractually required to use the information only to perform services for us and to protect it consistent with this Privacy Policy and applicable law.\n• Advertising and analytics partners — Subject to your choices and applicable law, we may share device and usage data with advertising networks and analytics providers to measure performance and serve relevant advertising. See Section 6 (Cookies) and Section 7 (Your Choices).\n• Legal and safety — Government, regulatory, or law-enforcement authorities when required by law, in response to subpoena or other legal process, or when we believe in good faith that disclosure is necessary to protect the rights, property, or safety of any person.\n• Business transfers — In connection with a merger, acquisition, financing, reorganization, bankruptcy, or sale of all or part of our business, in which case the receiving party will be required to honor commitments made in this Privacy Policy or notify you of material changes.\n• With your consent — Any other party with your direction or consent.\n\nWe do not sell your PHI. We do not share PHI with advertising networks or social-media platforms for their own marketing purposes.',
      },
      {
        heading: '5. Consumer Health Data',
        text: 'Certain U.S. state laws — including the Washington My Health My Data Act, the Nevada Consumer Health Data Privacy Law, and similar laws — regulate non-HIPAA consumer health data ("Consumer Health Data"). To the extent these laws apply, Nova MDK provides additional disclosures and rights with respect to such data.',
        subsections: [
          {
            heading: '5.1 What Is Consumer Health Data?',
            text: 'Consumer Health Data is personal information that is linked or reasonably linkable to a consumer and that identifies the consumer\'s past, present, or future physical or mental health status, including data such as the products and services you browse or purchase on the Platform, marketing preferences relating to specific health conditions, and approximate location data when used to infer health status.',
          },
          {
            heading: '5.2 How We Use and Share Consumer Health Data',
            text: 'We use and share Consumer Health Data only for the purposes described in Sections 3 and 4 above. We do not sell Consumer Health Data, and we obtain your consent (or, where required by law, your written authorization) before any sharing that requires it under applicable state law.',
          },
          {
            heading: '5.3 Your Rights',
            text: 'Where applicable state law applies, you have the right to (a) confirm whether we are processing your Consumer Health Data and access a copy, (b) request that we delete it, (c) withdraw consent, and (d) appeal a denial of any request. To exercise these rights, contact privacy@novamdk.com or use the contact information in Section 14.',
          },
        ],
      },
      {
        heading: '6. Cookies, Mobile IDs, and Similar Technologies',
        text: 'We and our service providers use cookies, web beacons, pixel tags, software development kits (SDKs), local storage, mobile advertising identifiers, and similar technologies (collectively, "Cookies") to operate the Platform, remember your preferences, analyze usage, and deliver relevant advertising.',
        subsections: [
          {
            heading: '6.1 Categories of Cookies',
            text: '• Strictly necessary — required for the Platform to function, including authentication, session management, and load balancing.\n• Functional — remember your preferences and choices, such as language and saved login state.\n• Analytics — help us understand how Users interact with the Platform so we can improve performance and user experience.\n• Advertising — deliver advertising on third-party platforms, measure ad performance, and (where you have consented) build audiences for marketing.',
          },
          {
            heading: '6.2 Your Cookie Choices',
            text: 'You can control Cookies through your browser settings (most browsers let you block or delete Cookies), through your device settings (mobile advertising identifiers can typically be reset or limited), and through opt-out mechanisms offered by industry groups such as the Network Advertising Initiative (networkadvertising.org/choices), the Digital Advertising Alliance (optout.aboutads.info), and the European Interactive Digital Advertising Alliance (youronlinechoices.eu). We also honor recognized opt-out signals such as Global Privacy Control ("GPC") where required by applicable law. Please note that blocking some types of Cookies may impact your experience on the Platform and the Services we are able to offer.',
          },
        ],
      },
      {
        heading: '7. Your Choices',
        subsections: [
          {
            heading: '7.1 Account Information',
            text: 'You may review and update your account information at any time by logging into your account or by contacting support@novamdk.com. You may close your account at any time; however, we may retain certain information as required or permitted by law (see Section 11).',
          },
          {
            heading: '7.2 Marketing Communications',
            text: 'You may opt out of marketing emails by clicking the "unsubscribe" link in any marketing email and may opt out of marketing SMS by replying STOP to any marketing text message. You may continue to receive transactional and clinical communications (such as order confirmations and prescription notifications) so long as your account remains active.',
          },
          {
            heading: '7.3 Push Notifications and Location',
            text: 'You can disable push notifications and precise location access at any time through your device settings.',
          },
          {
            heading: '7.4 Right to Opt-Out / "Do Not Sell or Share My Personal Information"',
            text: 'California residents have a right to opt-out from future "sales" or "sharing" of personal information as those terms are defined by the CCPA (see Section 8). Note that the CCPA defines "sell," "share," and "personal information" very broadly, and some of our data sharing described in this Privacy Policy may be considered a "sale" or "sharing" under those definitions. In particular, we let advertising and analytics providers collect identifiers (IP addresses, cookie IDs, and mobile IDs), activity data (browsing, clicks, app usage, non-product identifying transaction data), device data, and geolocation data through our sites and apps when you use our online services, but do not "sell" or "share" any other types of personal information.\n\nIf you do not wish for us or our partners to "sell" or "share" personal information relating to your visits to our sites for advertising purposes, you can make your request by visiting your privacy settings or using a Global Privacy Control. If you opt-out using these choices, we will not share or make available such personal information in ways that are considered a "sale" or "sharing" under the CCPA. However, we will continue to make available to our partners (acting as our service providers) some personal information to help us perform advertising-related functions. Further, using these choices will not opt you out of the use of previously "sold" or "shared" personal information or stop all interest-based advertising. Because opt-out preference signals operate at the browser/device level, you will need to enable the signal on each browser and device you use.\n\nWe do not knowingly sell or share the personal information of minors under 16 years of age.',
          },
        ],
      },
      {
        heading: '8. State Privacy Rights',
        text: 'Residents of certain U.S. states have specific rights under their state\'s privacy laws, including the California Consumer Privacy Act as amended ("CCPA/CPRA"), and similar laws in Colorado, Connecticut, Delaware, Indiana, Iowa, Maryland, Minnesota, Montana, New Hampshire, New Jersey, Nebraska, Oregon, Tennessee, Texas, Utah, Virginia, and other states (collectively, "State Privacy Laws").',
        subsections: [
          {
            heading: '8.1 Rights',
            text: 'Subject to your state\'s law and certain exceptions, you may have the right to:\n\n• Know or access the personal information we have collected about you;\n• Receive a copy of your personal information in a portable format;\n• Correct inaccurate personal information;\n• Delete your personal information;\n• Opt out of the sale or sharing of your personal information for cross-context behavioral advertising;\n• Opt out of certain profiling that produces legal or similarly significant effects;\n• Appeal our denial of any request. We will not discriminate against you for exercising any of these rights; and\n• Limit the use or disclosure of your sensitive personal information to purposes permitted by law.',
          },
          {
            heading: '8.2 How to Exercise Your Rights',
            text: 'To exercise any of these rights, email privacy@novamdk.com with the subject line "Privacy Rights Request", or write to the address in Section 14. We will respond within the timeframe required by applicable law. We may need to verify your identity before fulfilling a request, which may include confirming information already on file. You may designate an authorized agent to make a request on your behalf, subject to verification.',
          },
          {
            heading: '8.3 California "Shine the Light"',
            text: 'California Civil Code §1798.83 permits California residents to request, once per calendar year, a list of third parties to whom we disclosed personal information for direct-marketing purposes during the prior year. To make such a request, email privacy@novamdk.com.',
          },
          {
            heading: '8.4 Notice of Financial Incentives',
            text: 'From time to time, we may offer programs that involve the collection or use of personal information in exchange for a benefit (for example, a referral or loyalty program). If we offer such a program, we will provide a separate notice describing the material terms and how to opt in and out.',
          },
          {
            heading: '8.5 Limit Use of Sensitive Personal Information',
            text: 'Certain personal information we collect may constitute "sensitive personal information" under the CCPA/CPRA, including precise geolocation (where enabled), account log-in credentials, and information revealing health conditions inferred from your use of the Platform (see Section 5, Consumer Health Data). We use sensitive personal information only as reasonably necessary to provide the Services, ensure security, and for other purposes permitted without an opt-out under applicable law; we do not use it to infer characteristics about you for purposes unrelated to the Services. To the extent our practices require it, you may submit a request to limit the use of your sensitive personal information by emailing privacy@novamdk.com with the subject line "Limit Use of Sensitive Personal Information".',
          },
        ],
      },
      {
        heading: '9. Data Security',
        text: 'We implement administrative, technical, and physical safeguards designed to protect personal information against accidental or unlawful destruction, loss, alteration, unauthorized disclosure, or access. These safeguards include encryption of data in transit using Transport Layer Security (TLS), encryption of certain data at rest, access controls, employee training, and ongoing monitoring. No method of transmission over the internet or electronic storage is 100% secure, and we cannot guarantee absolute security. You are responsible for maintaining the confidentiality of your account credentials and for restricting access to your devices. If you believe your account or any information has been compromised, please notify us immediately at support@novamdk.com.',
      },
      {
        heading: '10. Children\'s Privacy',
        text: 'The Platform is intended for individuals at least 18 years of age. We do not knowingly collect personal information from children under 13, and we do not direct the Platform to children. If we learn that we have collected personal information from a child under 13 without verifiable parental consent, we will delete it as required by the Children\'s Online Privacy Protection Act (COPPA) and applicable law. If you believe a child under 13 has provided us personal information, please contact privacy@novamdk.com.',
      },
      {
        heading: '11. Data Retention',
        text: 'We retain personal information for as long as necessary to provide the Services, comply with our legal obligations (including state and federal recordkeeping requirements applicable to telehealth and pharmacy operations), resolve disputes, and enforce our agreements. Medical and prescription records held by any Platform Provider and any Platform Pharmacy are retained for periods required by applicable state and federal law, which generally exceed the minimum retention required for non-clinical data. When personal information is no longer needed, we will delete it or de-identify it in accordance with our retention schedule and applicable law.',
      },
      {
        heading: '12. International Users',
        text: 'The Services are intended for Users located in the United States. If you are accessing the Platform from outside the United States, you understand that your information will be transferred to, stored, and processed in the United States, where data-protection laws may differ from those in your jurisdiction. By using the Platform, you consent to such transfer and processing. The Services are not directed to individuals located in the European Economic Area, the United Kingdom, or other jurisdictions outside the United States, and we do not represent that the Platform complies with the laws of those jurisdictions.',
      },
      {
        heading: '13. Third-Party Sites and Services',
        text: 'The Platform may contain links to or integrate with third-party websites, applications, or services. This Privacy Policy does not apply to those third parties, and we are not responsible for their privacy practices. We encourage you to review the privacy policies of any third party before providing them with personal information.',
      },
      {
        heading: '14. Changes to This Policy and How to Contact Us',
        subsections: [
          {
            heading: '14.1 Changes',
            text: 'We may update this Privacy Policy from time to time. When we do, we will revise the "Last Updated" date at the top of this Policy. If we make material changes, we will provide additional notice (such as by email or through a Platform notice). Your continued use of the Platform after the effective date of the revised Policy constitutes your acceptance of the changes.',
          },
          {
            heading: '14.2 Contact',
            text: 'If you have any questions, comments, or requests regarding this Privacy Policy or our privacy practices, please contact us:\n\nNova MDK\nAttn: Privacy\n15570 Brookhurst St #238\nWestminster, CA 92683\n\nPrivacy: privacy@novamdk.com\nSupport: support@novamdk.com\nMedical: medteam@novamdk.com',
          },
        ],
      },
    ],
    closing: 'By using the Services, you acknowledge that you have read this Privacy Policy and understand how Nova MDK collects, uses, shares, and protects your information.',
  },

  /* The sitemap used to live here as a hand-maintained link list. It had drifted
     onto `/category/*` URLs the router never served, so every treatment link
     dead-ended. It is now a real page at /sitemap, generated from the catalog —
     see pages/SitemapPage.jsx. `/legal/sitemap` redirects there. */

  'telehealth-consent': {
    title: 'Telehealth Informed Consent',
    subtitle: 'Platform Providers',
    lastUpdated: 'July 16, 2026',
    intro: [
      'PLEASE READ THIS CONSENT CAREFULLY BEFORE PROCEEDING WITH ANY TELEHEALTH CONSULTATION. THIS IS NOT AN EMERGENCY MEDICAL SERVICE. PLEASE DIAL 911 IF YOU ARE EXPERIENCING A MEDICAL OR PSYCHOLOGICAL EMERGENCY.',
    ],
    content: [
      {
        heading: '1. Purpose of This Consent',
        text: 'The purpose of this Telehealth Informed Consent ("Consent") is to provide you with information about telehealth and to obtain your informed consent to receive healthcare services delivered by telehealth from a network of independent physicians contracted with Nova MDK, LLC ("PG," "Platform Providers," "Provider," or "Providers"), through the technology platform operated by Nova MDK (the "Platform" or "Service").\n\nIn this Consent, the words "you" and "yours" refer to the person receiving care through the Service. The word "Provider" means a physician holding an active Doctor of Medicine (M.D.) license in good standing in the state in which you are located at the time of consultation. PG does not utilize Doctors of Osteopathic Medicine (D.O.), physician assistants, nurse practitioners, or other non-M.D. clinicians.\n\nBy electronically signing this Consent or by clicking "I agree" where presented, you acknowledge that you have read, understood, and voluntarily consent to receive healthcare services through telehealth as described below.',
      },
      {
        heading: '2. Nature of Telehealth',
        text: 'Telehealth, as defined in California Business and Professions Code Section 2290.5 and similar laws in other states, is the delivery of healthcare services using information and communication technologies between a healthcare provider and a patient who are not in the same physical location. The terms "telehealth" and "telemedicine" are used interchangeably in this Consent.\n\nThrough the Service, telehealth may involve any of the following:\n\n• Asynchronous ("store-and-forward") communications, such as written intake questionnaires, secure messaging, and the transmission of photographs or other images that the Provider reviews when available;\n• Synchronous communications, such as live audio-only telephone calls or live audio-and-video calls;\n• Electronic transmission of medical records, laboratory results, prescriptions, and other clinical data; and\n• Remote monitoring of clinical information you submit between visits.\n\nThe choice of telehealth modality is at the Provider\'s clinical discretion and is determined by what is medically appropriate, what applicable law permits in your state, and what you are able and willing to use.',
      },
      {
        heading: '3. Potential Benefits of Telehealth',
        text: 'Telehealth may offer several benefits, including:\n\n• Improved access to medical care, especially when in-person care is inconvenient, unavailable, or unaffordable;\n• More efficient evaluation and management of certain conditions;\n• Greater convenience and flexibility in scheduling care;\n• Reduced travel time, time away from work, and exposure to other patients\' illnesses; and\n• Faster receipt of certain medications when clinically appropriate.',
      },
      {
        heading: '4. Potential Risks and Limitations of Telehealth',
        text: 'Telehealth also carries certain risks and limitations. You acknowledge and accept that:\n\n• Information transmitted may not be sufficient (for example, due to poor image resolution or incomplete medical history) for the Provider to make appropriate medical decisions, and the Provider may need to refer you to in-person care;\n• Delays in evaluation or treatment could occur due to deficiencies or failures of equipment or technology, including dropped connections, lost messages, or system outages;\n• The location and device and applications you choose to use to access telehealth services may expose your health information to third parties, such as using shared devices, using kiosks and devices in a public place, or using third-party applications in connection with the services;\n• Despite reasonable security measures, electronic transmission of your information could be disrupted or accessed by unauthorized persons in the rare case of a security breach;\n• In rare cases, a misdiagnosis or incorrect treatment recommendation could result from the inability to perform a complete in-person physical examination or to observe certain physical findings;\n• In rare cases, an adverse drug reaction or other negative outcome could result from a prescription issued via telehealth;\n• Telehealth may not be appropriate for all medical conditions, and your Provider may decline to treat your condition through telehealth and refer you to in-person care; and\n• Follow-up care, including in-person care, may be required.',
      },
      {
        heading: '5. Telehealth Is Not for Emergencies',
        text: 'TELEHEALTH IS NOT APPROPRIATE FOR MEDICAL OR PSYCHOLOGICAL EMERGENCIES. If you are experiencing a medical or psychological emergency — including but not limited to chest pain, difficulty breathing, signs of stroke or heart attack, severe bleeding, severe allergic reaction, extreme distress, hallucinations, suicidal ideation, or any other condition requiring immediate medical attention — do not use the Service. Call 911 or your local emergency services immediately, or go to the nearest emergency room.',
      },
      {
        heading: '6. What You Can Expect During a Telehealth Visit',
        text: 'During or in connection with your telehealth visit:\n\n• You will be asked to provide medical history, current symptoms, current medications, allergies, and other clinical information through an intake questionnaire, written messaging, photographs, or live audio/video as appropriate;\n• Your Provider will review the information you submit and may ask follow-up questions;\n• Your Provider will use his or her independent medical judgment to assess your condition and determine an appropriate plan of care, which may include prescribing medication, ordering laboratory tests, recommending lifestyle changes, referring you to in-person care, or declining to treat your condition through telehealth;\n• If a prescription is issued, it may be transmitted electronically to a platform pharmacy or, where you elect and where permitted, to a pharmacy of your choosing; and\n• You will have the opportunity to ask questions about your diagnosis, treatment, alternatives, risks, and benefits before agreeing to a treatment plan.',
      },
      {
        heading: '7. No Guarantee of Diagnosis, Treatment, Prescription, or Results',
        text: 'You understand and agree that the use of the Service does not guarantee any particular diagnosis or that any prescription, course of treatment, or medication will be ordered. The Provider may, in the exercise of his or her independent medical judgment:\n\n• Decline to issue a prescription;\n• Prescribe a medication different from the one you may have requested;\n• Recommend lifestyle changes or alternative therapies in lieu of medication;\n• Refer you to in-person evaluation or to a specialist; or\n• Decline to treat your condition through telehealth.\n\nPayment for or completion of an intake or consultation does not entitle you to any particular outcome.\n\nProviders do not prescribe medications classified as controlled substances under U.S. Drug Enforcement Administration (DEA) Schedules I through V.\n\nYou also understand and agree that the Provider may, in the exercise of his or her independent medical judgment:\n\n• prescribe substances and medications that are not FDA approved for the particular prescribed use;\n• prescribe compounded substances and medications for your personal use that have not been approved or evaluated by the FDA for safety, effectiveness, or quality; and\n• prescribe experimental research chemicals or other substances, such as peptides, that have limited safety and efficacy data.\n\nNeither the Platform Providers, nor Nova MDK, guarantee any particular result, or any result at all from the use of any prescribed drug or substance. Use of any prescribed substance may result in side effects and is entirely voluntary.',
      },
      {
        heading: '8. Your Responsibilities',
        text: 'To receive safe and effective telehealth care, you agree that you will:\n\n• Provide truthful, accurate, complete, and current information about your medical history, symptoms, medications, allergies, pregnancy or lactation status, and any other information requested in any intake form, questionnaire, or message;\n• Promptly update your Provider if your medical condition or relevant information changes during the course of treatment, including new medications, new diagnoses, new symptoms, side effects, pregnancy, or pregnancy planning;\n• Be physically located in the United States and in a state where the Service is available at the time of any consultation;\n• Use the Service only for yourself, unless you are an authorized parent, legal guardian, or legal representative who has the right to consent to care on behalf of the person being treated;\n• Provide and maintain, at your own expense, the equipment and internet connectivity required to use the Service;\n• Find a private location for any audio or video visit so that confidential information is not overheard or observed by unauthorized persons; and\n• Disclose to your Provider any other healthcare providers involved in your care and share information about your telehealth treatment with them as appropriate.\n\nProviding false, incomplete, or misleading information may result in inappropriate treatment recommendations and may seriously harm your health.',
      },
      {
        heading: '9. Privacy, Confidentiality, and Security',
        text: 'All medical information shared in the course of your telehealth visit is protected by federal law (HIPAA) and applicable state law to the same extent as medical information shared in an in-person visit. The Platform uses commercially reasonable administrative, technical, and physical safeguards — including encryption of data in transit — to protect your information. PG\'s use and disclosure of your protected health information are described in PG\'s Notice of Privacy Practices, and Nova MDK\'s handling of non-clinical platform data is described in the Nova MDK Privacy Policy.\n\nYou understand that, despite reasonable safeguards, no method of electronic communication or storage is completely secure, and there is some inherent risk that confidential information transmitted electronically could be intercepted by an unauthorized person. By signing this Consent, you accept that risk. Email, SMS, and similar communications between you and the Service may include personal health information. You understand that Nova MDK cannot guarantee the security of communications you send or receive through your own email provider, mobile carrier, or device.',
      },
      {
        heading: '10. Authorization to Access and Share Health Records',
        text: 'By accepting this Consent, you authorize your Provider, PG, Nova MDK, and Nova MDK\'s third-party pharmacies ("Platform Pharmacies"), and their respective workforce members, to access, retrieve, review, and exchange your medical records, prescription history, and other relevant clinical information as necessary for diagnosis, treatment, care coordination, prescription dispensing, payment, and healthcare operations as permitted by HIPAA and applicable state law. You also authorize your Provider to communicate with other healthcare providers involved in your care and, where clinically appropriate, with your designated pharmacy, laboratory, or other ancillary service provider.',
      },
      {
        heading: '11. Laboratory Testing and Diagnostic Services',
        text: 'Certain treatment plans may require that you complete laboratory tests or other diagnostic services. These tests are typically performed by independent third-party laboratories. Neither Nova MDK, PG, nor your Provider operates the laboratory and we cannot guarantee the accuracy, reliability, or availability of any laboratory result. Laboratory tests may yield false-negative, false-positive, or inconclusive results that could affect your Provider\'s ability to diagnose or treat your condition. If your Provider orders laboratory testing, you agree to follow the instructions provided regarding scheduling, sample collection, and follow-up.',
      },
      {
        heading: '12. Prescriptions and Pharmacy Services',
        text: 'If your Provider issues a prescription, you may have the option to fill it through a Platform Pharmacy (pharmacies licensed to dispense in all 50 United States) or, where available, through a pharmacy of your choosing. Where your Provider prescribes a compounded medication, you understand that compounded medications are not approved by the U.S. Food and Drug Administration (FDA) and are prepared by a licensed pharmacy pursuant to a valid prescription based on the patient-specific clinical judgment of your Provider. You further understand that the process of compounding may result in batch-to-batch variability within tolerable ranges, and you may be prescribed substances that are experimental research chemicals for purposes of FDA regulatory guidelines. You will be informed when a medication is compounded and/or a research chemical prior to dispensing.',
      },
      {
        heading: '13. Your Right to Withdraw Consent',
        text: 'You have the right to withdraw your consent to the use of telehealth at any time, without affecting your right to future care or treatment and without losing or risking the loss of any benefits to which you are otherwise entitled. To withdraw your consent, send written notice to your Provider through the Platform or email medteam@novamdk.com. You understand that withdrawal of consent will not affect any action taken by Nova MDK, the PG, or your Provider in reliance on this Consent before the withdrawal was received. You also understand that PG Providers do not offer in-person care, so withdrawal of your consent to telehealth means that you will need to seek care from a different provider.',
        subsections: [
          {
            heading: 'Right to Refuse',
            text: 'You may also refuse to use telehealth for any particular visit and may instead seek in-person care from a different provider, without any penalty from Nova MDK or PG.',
          },
        ],
      },
      {
        heading: '14. California-Specific Disclosures',
        text: 'California Business and Professions Code Section 2290.5. If you are a California resident or located in California at the time of consultation, the following additional disclosures apply pursuant to California law governing telehealth:',
        subsections: [
          {
            heading: 'Right to Verbal or Written Consent',
            text: 'California requires that, prior to the delivery of healthcare via telehealth, your Provider obtains your verbal or written consent and documents that consent in your medical record. By accepting this Consent electronically, you provide that documented consent.',
          },
          {
            heading: 'Provider Identification',
            text: 'You have the right to be informed of the name, professional title (M.D.), state(s) of licensure, and California Medical Board license number of any California-licensed Provider who treats you. This information will be made available to you through the Platform or upon request to medteam@novamdk.com.',
          },
          {
            heading: 'Medical Board of California',
            text: 'The Medical Board of California receives and investigates complaints regarding California-licensed physicians. Complaints may be directed to: Medical Board of California, 2005 Evergreen Street, Suite 1200, Sacramento, CA 95815; (800) 633-2322; www.mbc.ca.gov.',
          },
          {
            heading: 'California Board of Pharmacy',
            text: 'The California State Board of Pharmacy receives and investigates complaints regarding pharmacies and pharmacists. Complaints may be directed to: California State Board of Pharmacy, 2720 Gateway Oaks Drive, Suite 100, Sacramento, CA 95833; (916) 518-3100; www.pharmacy.ca.gov.',
          },
          {
            heading: 'California Confidentiality of Medical Information Act (CMIA)',
            text: 'Your medical information is also protected under the California Confidentiality of Medical Information Act (Civil Code Section 56 et seq.), in addition to HIPAA.',
          },
          {
            heading: 'California Online Prescribing',
            text: 'Under California law, the issuance of a prescription requires an appropriate prior examination and the establishment of a physician-patient relationship. Your Provider will conduct that examination through telehealth in accordance with California Business and Professions Code Section 2242 and applicable Medical Board guidance. Submission of an intake form alone is not sufficient — your Provider must review your information and determine that telehealth is medically appropriate.',
          },
        ],
      },
      {
        heading: '15. Consent for Minors and Authorized Representatives',
        text: 'The Service is generally intended for adults age 18 and older. If care is being sought for a minor or for an adult who is not legally able to consent on their own behalf, the Consent must be provided by a parent, legal guardian, or other authorized legal representative. By providing consent on behalf of another person, you represent and warrant that you are legally authorized to do so and that you accept all responsibilities under this Consent on the patient\'s behalf.',
      },
      {
        heading: '16. Acknowledgment and Consent',
        text: 'By checking the "I agree" box, electronically signing this Consent, or otherwise indicating your acceptance through the Platform, you acknowledge and agree that:\n\n• You have read this Consent in its entirety and understand its contents;\n• You have had the opportunity to ask questions about the use of telehealth and any questions have been answered to your satisfaction;\n• You understand the potential benefits, risks, limitations, and alternatives of telehealth;\n• You voluntarily consent to receive healthcare services through telehealth as described above;\n• You authorize your Provider, PG, Nova MDK, and the Platform Pharmacies to access, use, and disclose your health information as described in Section 10 and as permitted by law;\n• You understand that you may withdraw this Consent at any time as described in Section 13; and\n• You are at least 18 years old, or you are a parent, legal guardian, or authorized legal representative providing consent on behalf of another person.',
      },
      {
        heading: '17. Contact Information',
        text: 'Questions about this Consent or your telehealth care?\n\nNova MDK\n15570 Brookhurst St #238\nWestminster, CA 92683\n\nMedical questions: medteam@novamdk.com\nGeneral support: support@novamdk.com',
      },
    ],
    closing: 'PATIENT ACKNOWLEDGMENT — I have read and understand this Telehealth Informed Consent. I have had the opportunity to ask questions and have received answers to my satisfaction. I voluntarily consent to receive healthcare services through telehealth as described in this Consent. When this Consent is accepted electronically through the Platform, your acceptance is recorded with a date and time stamp and constitutes your legal signature.',
  },

  'hipaa-notice-of-privacy-practices': {
    title: 'Platform Providers Notice of Privacy Practices',
    subtitle: 'Platform Providers',
    lastUpdated: 'July 16, 2026',
    intro: [
      'THIS NOTICE DESCRIBES HOW MEDICAL INFORMATION ABOUT YOU MAY BE USED AND DISCLOSED AND HOW YOU CAN GET ACCESS TO THIS INFORMATION. PLEASE REVIEW IT CAREFULLY.',
    ],
    content: [
      {
        heading: '1. Who Follows This Notice',
        text: 'This Notice of Privacy Practices ("Notice") is provided by the independent professional medical group whose affiliated physicians provide clinical care to you through the Nova MDK telehealth platform ("Platform Providers," "PG," "we," "us," or "our"). PG is a "covered entity" under the federal Health Insurance Portability and Accountability Act of 1996 and its implementing regulations ("HIPAA"). This Notice applies to the protected health information ("PHI") created or received by PG and its affiliated providers and workforce in the course of providing you care. It describes our legal duties and your rights concerning your PHI. Nova MDK\'s handling of non-clinical platform information is described separately in the Nova MDK Privacy Policy and Consumer Health Data Privacy Notice; those notices are not a substitute for this Notice.',
      },
      {
        heading: '2. Our Pledge Regarding Your Health Information',
        text: 'We understand that information about you and your health is personal. We are committed to protecting it. We are required by law to: (i) maintain the privacy of your PHI; (ii) provide you with this Notice of our legal duties and privacy practices with respect to your PHI; (iii) notify you following a breach of unsecured PHI; and (iv) follow the terms of the Notice currently in effect.',
      },
      {
        heading: '3. How We May Use and Disclose Your Health Information',
        text: 'The following categories describe the ways we may use and disclose your PHI for treatment, payment, and healthcare operations, and other permitted purposes:',
        subsections: [
          {
            heading: 'For Treatment',
            text: 'We may use and disclose your PHI to provide, coordinate, or manage your healthcare and related services. For example, a Provider may review your intake, history, photographs, and lab results to evaluate your condition, and may share your information with a dispensing pharmacy, a laboratory, or another provider involved in your care.',
          },
          {
            heading: 'For Payment',
            text: 'We may use and disclose your PHI to obtain payment for the services you receive — for example, to bill and collect from you or a payer, or to verify eligibility and coverage.',
          },
          {
            heading: 'For Healthcare Operations',
            text: 'We may use and disclose your PHI for our healthcare operations, such as quality assessment and improvement, reviewing the competence or qualifications of providers, care coordination, handling your complaints, and general administrative activities. We may share PHI with our business associates (for example, Nova MDK and its third-party technology platform operators) who perform services on our behalf and who are required by written agreement to protect your PHI.',
          },
          {
            heading: 'Appointment Reminders and Health-Related Communications',
            text: 'We may contact you to provide appointment reminders, refill notifications, lab result notifications, or information about treatment alternatives or other health-related benefits and services that may be of interest to you.',
          },
          {
            heading: 'As Required or Permitted by Law',
            text: 'We may use or disclose your PHI when required by law, or as permitted for public health activities, reporting of abuse or neglect, health oversight activities, judicial and administrative proceedings, law enforcement purposes, to coroners or medical examiners, organ and tissue donation, research subject to applicable safeguards, to avert a serious threat to health or safety, for specialized government functions, and for workers\' compensation — in each case only to the extent permitted and as limited by applicable law.',
          },
        ],
      },
      {
        heading: '4. Uses and Disclosures That Require Your Written Authorization',
        text: 'Other uses and disclosures of your PHI not described in this Notice will be made only with your written authorization. In particular, the following uses and disclosures require your authorization: (i) most uses and disclosures of psychotherapy notes; (ii) uses and disclosures for marketing purposes; and (iii) disclosures that constitute a sale of PHI. You may revoke an authorization in writing at any time, except to the extent we have already acted in reliance on it.',
      },
      {
        heading: '5. Your Rights Regarding Your Health Information',
        text: 'You have the following rights with respect to your PHI:',
        subsections: [
          {
            heading: 'Right to Access and Receive a Copy',
            text: 'You have the right to inspect and obtain a copy of your PHI that we maintain in a designated record set, including in an electronic format where readily producible. We may charge a reasonable, cost-based fee. We may deny access in certain limited circumstances permitted by law, some of which are subject to review.',
          },
          {
            heading: 'Right to Amend',
            text: 'If you believe PHI we maintain about you is incorrect or incomplete, you may request that we amend it. We may deny your request in certain circumstances, and we will provide a written explanation if we do.',
          },
          {
            heading: 'Right to an Accounting of Disclosures',
            text: 'You have the right to request an accounting of certain disclosures of your PHI made by us, other than disclosures for treatment, payment, healthcare operations, and certain other excepted disclosures.',
          },
          {
            heading: 'Right to Request Restrictions',
            text: 'You have the right to request a restriction on how we use or disclose your PHI for treatment, payment, or healthcare operations. We are not required to agree to all requests, except that we will comply with a request to restrict disclosure to a health plan for payment or operations where you have paid for the item or service in full out of pocket, as required by law.',
          },
          {
            heading: 'Right to Confidential Communications',
            text: 'You have the right to request that we communicate with you about medical matters in a certain way or at a certain location. We will accommodate reasonable requests.',
          },
          {
            heading: 'Right to a Paper Copy of This Notice',
            text: 'You have the right to obtain a paper copy of this Notice upon request, even if you have agreed to receive it electronically.',
          },
          {
            heading: 'Right to Breach Notification',
            text: 'You have the right to be notified following a breach of your unsecured PHI, as required by law.',
          },
          {
            heading: 'Right to Request Deletion in Certain States',
            text: 'You may have the right to request that we delete your personal information, depending on your state of residence. We will respond to your request in the timeframe required under applicable law. If we are unable to honor your request, we will notify you of our decision. If we deny your request, you have the right to submit to us a written statement of the reasons for your disagreement with our assessment of the disputed information and what you consider to be the correct information. We will make your statement accessible to parties reviewing the information in dispute.',
          },
        ],
      },
      {
        heading: '6. Our Duties',
        text: 'We are required by law to maintain the privacy and security of your PHI, to provide you with this Notice of our legal duties and privacy practices, to notify affected individuals following a breach of unsecured PHI, and to abide by the terms of the Notice currently in effect. We reserve the right to change this Notice and to make the revised Notice effective for PHI we already have as well as any information we receive in the future.',
      },
      {
        heading: '7. Changes to This Notice',
        text: 'We may change the terms of this Notice at any time. The revised Notice will apply to all PHI that we maintain. When we make a material change, we will post the revised Notice on the Nova MDK platform and make it available upon request. The effective date is shown above.',
      },
      {
        heading: '8. How to File a Complaint',
        text: 'If you believe your privacy rights have been violated, you may file a complaint with us using the contact information below, or with the Secretary of the U.S. Department of Health and Human Services, Office for Civil Rights. You will not be retaliated against, penalized, or denied care for filing a complaint.\n\nU.S. Department of Health and Human Services\nOffice for Civil Rights\n200 Independence Avenue, S.W., Washington, D.C. 20201\n1-877-696-6775 • www.hhs.gov/ocr/privacy/hipaa/complaints/',
      },
      {
        heading: '9. Contact — Privacy Officer',
        text: 'To exercise any of your rights, to request a paper copy of this Notice, or to ask questions or file a complaint, contact the Nova MDK Privacy Officer:\n\nNova MDK — Privacy Officer\n15570 Brookhurst St #238\nWestminster, CA 92683\nprivacy@novamdk.com',
      },
    ],
    closing: 'This Notice is provided in accordance with HIPAA (45 C.F.R. Parts 160 and 164). For your protections under California law, see also the Consumer Health Data Privacy Notice and the Telehealth Informed Consent.',
  },

  'consumer-health-data': {
    title: 'Consumer Health Data Privacy Notice',
    lastUpdated: 'June 20, 2026',
    intro: [
      'This Consumer Health Data Privacy Notice (this "Notice") supplements the Nova MDK Privacy Policy and describes how Nova MDK ("Nova MDK," "we," "us," or "our") handles "Consumer Health Data" under U.S. state consumer health privacy laws, including the Washington My Health My Data Act ("MHMDA"), RCW 19.373; the Nevada Consumer Health Data Privacy Law ("Nevada CHDPL"), SB 370; the Connecticut Data Privacy Act, as amended ("CTDPA"); and other state consumer health privacy laws to the extent they apply.\n\nWhere this Notice conflicts with the Nova MDK Privacy Policy with respect to Consumer Health Data, this Notice controls.',
    ],
    content: [
      {
        heading: '1. The Two Frameworks: HIPAA vs. Consumer Health Data',
        text: 'Nova MDK operates a technology platform that facilitates connections between Users and (i) an independent medical group of M.D. Physicians ("Platform Providers," "PG," "Provider," and "Providers"), and (ii) one or more licensed pharmacies ("Platform Pharmacy").\n\nInformation you share with PG or Platform Pharmacy as part of your medical care — including your medical history, intake answers, prescriptions, lab results, and clinical communications with your Provider — is protected health information ("PHI") governed by the federal Health Insurance Portability and Accountability Act ("HIPAA"). That information is described in PG\'s separate Notice of Privacy Practices and Platform Pharmacy\'s Notice of Privacy Practices, not in this Notice. HIPAA-regulated PHI is not subject to this Notice.\n\nThis Notice covers the non-PHI Consumer Health Data that Nova MDK collects in operating the Platform — for example, the condition pages you browse, the products you view or purchase, the marketing audiences we associate you with, and approximate location data when used to infer a health interest. State consumer health privacy laws regulate this category of data even when it is not PHI under HIPAA.',
      },
      {
        heading: '2. What Is Consumer Health Data?',
        text: 'Under MHMDA and similar laws, "Consumer Health Data" means personal information that is linked or reasonably linkable to a consumer and that identifies the consumer\'s past, present, or future physical or mental health status. As applied to Nova MDK, Consumer Health Data may include:\n\n• The fact that you have visited the Platform or specific pages on the Platform that relate to particular health conditions, treatments, or symptoms;\n• Products and services you browse, place in a cart, purchase, or subscribe to through the Platform;\n• Marketing preferences and audience segments associated with specific health conditions or treatment areas;\n• Approximate location information (e.g., derived from IP address) when used to infer that you are seeking health services;\n• Inferences, derivative data, or proxy data we generate from non-health data that we use to identify a health status, condition, treatment need, or attempt to seek health services; and\n• Identifiers (such as account ID, email, advertising ID, or hashed identifiers) when associated with any of the above.\n\nConsumer Health Data does not include de-identified data, publicly available information, or PHI governed by HIPAA.',
      },
      {
        heading: '3. Categories of Consumer Health Data We Collect',
        text: 'We collect the following categories of Consumer Health Data through the Platform:\n\n• Browsing and engagement data with health context — pages viewed within the Platform that relate to specific conditions or treatments; search terms entered on the Platform; links clicked in marketing emails about specific health topics.\n• Product and subscription data — products viewed, added to cart, purchased, or subscribed to; refill activity; cancellation activity.\n• Approximate location — general geographic location derived from IP address.\n• Marketing audience and preference data — marketing list segments, communication preferences related to specific conditions, engagement with health-related campaigns.\n• Identifiers used in advertising and analytics — cookies, mobile advertising IDs, device identifiers, hashed email or phone, when associated with any of the above.\n• Inferences — inferences drawn from any of the above to identify a health status, condition, treatment need, or attempt to seek health services.\n\nWe do not include PHI in any of the above categories. Information you submit to your Provider through medical intake forms, secure messaging, photographs for clinical review, lab results, and prescription records is PHI governed by HIPAA and is not used by Nova MDK outside of the clinical and pharmacy purposes described in PG\'s and Platform Pharmacy\'s Notices of Privacy Practices.',
      },
      {
        heading: '4. Sources of Consumer Health Data',
        text: 'We collect Consumer Health Data from:\n\n• You directly, when you create an account, set marketing preferences, browse the Platform, or place an order;\n• Your devices and browsers, automatically, through cookies, pixels, SDKs, mobile advertising IDs, and similar technologies;\n• Service providers that help us operate, secure, and analyze the Platform; and\n• Advertising and analytics partners, in the form of audience information, measurement data, and similar inputs.',
      },
      {
        heading: '5. How We Use Consumer Health Data',
        text: 'We use Consumer Health Data only for the following purposes:\n\n• Provide and operate the Platform — including routing requests to PG and Platform Pharmacy, processing payments, managing subscriptions, and customer support;\n• Personalize your experience — including showing you content and product information relevant to interests you have expressed on the Platform;\n• Communicate with you — including transactional communications about your account, orders, and subscriptions, and (with your consent where required) marketing communications about Nova MDK Services;\n• Measure, analyze, and improve the Platform — including understanding how Users navigate the Platform, troubleshooting, and improving the Services;\n• Marketing and advertising about Nova MDK Services, in accordance with Section 7 below and your consent or authorization where required by law;\n• Security, fraud prevention, and enforcement of our Terms of Service and applicable law; and\n• Comply with legal obligations and respond to lawful government and regulatory requests.\n\nWe do not use Consumer Health Data for purposes materially different from those listed above without first obtaining your consent or, where required, your separate valid authorization.',
      },
      {
        heading: '6. How We Share Consumer Health Data',
        text: 'We share Consumer Health Data only with the following categories of recipients, and only as described in this Notice:\n\n• Service providers and processors that operate the Platform on our behalf — including hosting, cloud infrastructure, customer support, email and SMS delivery, identity verification, fraud prevention, analytics, and IT support — under written contracts that limit their use of the data to providing services to Nova MDK;\n• PG and Platform Pharmacy, only to the extent needed to facilitate your consultations and prescriptions; once shared with PG or Platform Pharmacy for clinical or pharmacy purposes, the relevant information is treated as PHI under HIPAA;\n• Advertising and analytics partners, subject to your separate, valid authorization where required by law (see Section 7);\n• Government authorities and other third parties when required by law, subpoena, court order, or to protect rights, safety, or property; and\n• Parties to a corporate transaction (such as a merger, acquisition, financing, or asset sale), subject to confidentiality and consistent commitments.\n\nWe do not sell Consumer Health Data without your separate, valid authorization. We do not share Consumer Health Data with law enforcement based solely on its content (for example, browsing related to reproductive or gender-affirming care) absent valid legal process we are required to honor.',
      },
      {
        heading: '7. Advertising, Pixels, and Authorization',
        text: 'We use third-party advertising and analytics technologies — including cookies, pixels, tags, conversion APIs, and SDKs from advertising partners (which may include, for example, Meta, Google, and TikTok) — to measure the performance of our advertising and to deliver advertising about Nova MDK Services. PHI is never shared with advertising or analytics partners.\n\nWe will not share Consumer Health Data with advertising partners for advertising purposes unless you have provided separate, opt-in valid authorization. Where required by law, we obtain that authorization through a clear, standalone consent flow — separate from our general Terms of Service, Privacy Policy, and cookie banner — that identifies the specific categories of Consumer Health Data being shared; identifies the specific recipients (or categories of recipients) that will receive the data; identifies the purposes of the sharing; states the duration of the authorization; discloses your right to revoke the authorization at any time and how to do so; and is signed (electronically) by you and dated, with a copy made available to you.\n\nYou may withdraw your authorization at any time by contacting us using the information in Section 11. Withdrawing authorization will stop future sharing for advertising purposes; it will not unwind data already shared in reliance on a prior authorization.\n\nWe honor recognized opt-out signals such as Global Privacy Control ("GPC") where required by applicable law.',
      },
      {
        heading: '8. Your Rights',
        text: 'Depending on your state of residence and applicable law, you may have the following rights with respect to your Consumer Health Data:\n\n• Right to confirm whether we are processing your Consumer Health Data and to access a copy;\n• Right to a list of recipients with whom we have shared your Consumer Health Data, including affiliates, service providers, and any third parties (and contact information for those recipients), as required by MHMDA and similar laws;\n• Right to delete your Consumer Health Data, subject to limited legal exceptions (for example, recordkeeping obligations applicable to telehealth and pharmacy operations carried out by PG and Platform Pharmacy);\n• Right to withdraw consent or authorization previously provided for the collection, sharing, or sale of your Consumer Health Data;\n• Right to appeal a denial of any of the above requests; and\n• Right to non-discrimination for exercising any of these rights.\n\nTo exercise any of these rights, email privacy@novamdk.com with the subject line "Consumer Health Data Request", or write to us at the address in Section 11. We will verify your identity before fulfilling a request and will respond within the timeframe required by applicable law.\n\nTo appeal a denial, reply to our denial email or write to privacy@novamdk.com with the subject line "Consumer Health Data Appeal". If your appeal is denied, you may contact your state attorney general:\n\n• Washington Attorney General: www.atg.wa.gov\n• Nevada Attorney General: ag.nv.gov\n• Connecticut Attorney General: portal.ct.gov/ag',
      },
      {
        heading: '9. Data Retention',
        text: 'We retain Consumer Health Data only as long as reasonably necessary to provide the Services, comply with our legal obligations, resolve disputes, and enforce our agreements, in accordance with our retention schedule. Clinical and pharmacy records held by PG and Platform Pharmacy are PHI subject to HIPAA and to state and federal recordkeeping requirements applicable to medical and pharmacy records, and are governed by the respective Notices of Privacy Practices rather than this Notice. When Consumer Health Data is no longer needed, we delete or de-identify it consistent with our retention schedule and applicable law.',
      },
      {
        heading: '10. Security',
        text: 'Nova MDK maintains administrative, technical, and physical safeguards designed to protect Consumer Health Data against unauthorized access, disclosure, alteration, and destruction, including encryption of data in transit using TLS, encryption of certain data at rest, access controls, employee training, and ongoing monitoring. Access to Consumer Health Data within Nova MDK is limited to personnel and contractors who need it to perform their job functions and who are bound by confidentiality obligations. No method of transmission or storage is 100% secure, and we cannot guarantee absolute security.',
      },
      {
        heading: '11. Contact Us',
        text: 'To exercise your rights, ask questions, submit a complaint, or withdraw an authorization with respect to Consumer Health Data, contact us at:\n\nNova MDK\nAttn: Privacy\n15570 Brookhurst St #238\nWestminster, CA 92683\n\nPrivacy: privacy@novamdk.com\nSupport: support@novamdk.com',
      },
      {
        heading: '12. Changes to This Notice',
        text: 'We may update this Notice from time to time. When we do, we will revise the "Last Updated" date above. If we make material changes, we will provide additional notice (such as by email or a notice on the Platform) before the changes take effect, where required by law.',
      },
    ],
    closing: 'By using the Services, you acknowledge that you have read this Consumer Health Data Privacy Notice and understand how Nova MDK collects, uses, shares, and protects your Consumer Health Data.',
  }
};

export default function LegalPage() {
  const { policyId } = useParams();
  const documentData = legalDocuments[policyId];

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [policyId]);

  if (!documentData) {
    return (
      <div className="min-h-screen bg-surface flex flex-col font-sans text-ink">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
          <h1 className="text-3xl font-baskerville mb-4">Document Not Found</h1>
          <p className="text-ink/60 mb-8">The legal document you are looking for does not exist.</p>
          <Link to="/" className="text-primary hover:underline">Return to Homepage</Link>
        </div>
        <Footer />
      </div>
    );
  }

  const renderSubsections = (subsections) => {
    if (!subsections) return null;
    return subsections.map((sub, subIdx) => (
      <div key={subIdx} className="mt-5 pl-4 border-l-2 border-line">
        <h3 className="text-base sm:text-[17px] font-semibold text-ink mb-2 font-baskerville">
          {sub.heading}
        </h3>
        {sub.text && (
          <p className="whitespace-pre-line text-[14px] sm:text-[15px] md:text-[16px] leading-relaxed text-ink/80 font-light">
            {withLinks(sub.text)}
          </p>
        )}
      </div>
    ));
  };

  return (
    <div className="min-h-screen bg-bg flex flex-col font-sans text-ink">
      <Seo
        title={documentData.title}
        description={`${documentData.title} for Nova MDK telehealth services. Last updated ${documentData.lastUpdated}.`}
        path={`/legal/${policyId}`}
      />
      <Navbar />

      <main className="flex-1 w-full max-w-[850px] mx-auto px-4 sm:px-6 md:px-12 py-8 md:py-24">

        <BackButton className="mb-6" />

        <div className="bg-surface rounded-3xl md:rounded-[calc(40px*var(--nv-r-scale,1))] p-6 sm:p-8 md:p-16 border border-line shadow-sm">

          {/* Header */}
          <div className="mb-8 md:mb-12 border-b border-line pb-6 md:pb-8">
            <h1 className="text-2xl sm:text-4xl md:text-4xl font-baskerville font-medium tracking-tight text-ink mb-2 md:mb-3">
              {documentData.title}
            </h1>
            {documentData.subtitle && (
              <p className="text-sm md:text-base text-ink/70 font-medium mb-2">
                {documentData.subtitle}
              </p>
            )}
            <p className="text-xs md:text-sm text-ink/50 uppercase tracking-widest font-medium">
              Last Updated: {documentData.lastUpdated}
            </p>
          </div>

          {/* Intro paragraphs */}
          {documentData.intro && (
            <div className="mb-8 md:mb-10 space-y-4 text-[14.5px] sm:text-[15px] md:text-[16px] leading-relaxed text-ink/80 font-light">
              {documentData.intro.map((para, i) => (
                <p key={i} className="whitespace-pre-line">{withLinks(para)}</p>
              ))}
            </div>
          )}

          {/* Main content sections */}
          <div className="space-y-8 md:space-y-10 text-[14.5px] sm:text-[15px] md:text-[16px] leading-relaxed text-ink/80 font-light">
            {documentData.content.map((section, index) => (
              <div key={index}>
                <h2 className="text-lg sm:text-xl font-medium text-ink mb-3 md:mb-4 font-baskerville">
                  {section.heading}
                </h2>

                {section.text && (
                  <p className="whitespace-pre-line">{withLinks(section.text)}</p>
                )}

                {/* Subsections */}
                {section.subsections && renderSubsections(section.subsections)}

                {/* Sitemap links */}
                {section.links && (
                  <ul className="space-y-3">
                    {section.links.map((link, linkIdx) => (
                      <li key={linkIdx} className="flex items-center gap-3">
                        <span className="text-primary text-lg leading-none">•</span>
                        {link.url.startsWith('#') ? (
                          <a href={link.url} className="hover:text-primary hover:translate-x-1 transition-all inline-block font-medium">
                            {link.label}
                          </a>
                        ) : (
                          <Link to={link.url} className="hover:text-primary hover:translate-x-1 transition-all inline-block font-medium">
                            {link.label}
                          </Link>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>

          {/* Closing statement */}
          {documentData.closing && (
            <div className="mt-10 md:mt-12 pt-6 md:pt-8 border-t border-line">
              <p className="text-[14px] sm:text-[15px] text-ink/70 italic whitespace-pre-line leading-relaxed">
                {documentData.closing}
              </p>
            </div>
          )}

          {/* Footer note + registered address */}
          <div className="mt-8 md:mt-10 pt-6 md:pt-8 border-t border-line text-xs sm:text-sm text-ink/50">
            If you have any questions regarding these policies, please contact our legal department via the{' '}
            <Link to="/contact" className="text-primary hover:underline">Contact Page</Link>.
            <address className="mt-4 not-italic leading-relaxed">
              <span className="font-medium text-ink/70">Nova MDK</span><br />
              15570 Brookhurst St #238<br />
              Westminster, CA 92683
            </address>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}