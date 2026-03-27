import { EVENT, getActivityDescriptionLines } from './event-config.js';

export function getResolvedWaivers({ isMinor = false } = {}) {
  const contactLine = EVENT.contactEmail
    ? `For future promotional uses that have not yet been published, you may contact the event organizers at ${EVENT.contactEmail}. Materials already printed, posted, broadcast, archived, or shared may not be able to be withdrawn.`
    : 'For future promotional uses that have not yet been published, you may contact the event organizers. Materials already printed, posted, broadcast, archived, or shared may not be able to be withdrawn.';

  return [
    {
      id: 'liability',
      title: 'Waiver of Liability, Assumption of Risk, and Indemnity Agreement',
      subtitle: `University of California, ${EVENT.campus}`,
      summary:
        'This electronic packet captures the content of the student organization liability waiver for this event.',
      sourceFooter: EVENT.liabilitySourceLabel,
      eventBox: {
        organization: EVENT.organizationName,
        activityLines: getActivityDescriptionLines(),
      },
      guardianNote: isMinor
        ? 'Because the participant is under 18, the parent or legal guardian must also sign.'
        : 'Parent or legal guardian signature is only required if the participant is under 18.',
      sections: [
        {
          heading: 'Waiver',
          paragraphs: [
            `In return for being permitted to participate in the following activity or program (“The Activity”), including any associated use of the premises, facilities, staff, equipment, transportation, and services of the University, I, for myself, heirs, personal representatives, and assigns, do hereby release, waive, discharge, and promise not to sue The Regents of the University of California, and the student organization/club listed below, and their respective directors, officers, employees, and agents (collectively “The Releasees”), from liability from any and all claims, including the negligence of The Releasees, resulting in personal injury (including death), accidents or illnesses, and property loss, in connection with my participation in the Activity and any use of University premises and facilities.`,
          ],
        },
        {
          heading: 'Assumption of Risks',
          paragraphs: [
            'Participation in The Activity carries with it certain inherent risks that cannot be eliminated regardless of the care taken to avoid injury. The specific risks vary from one activity to another, but the risks range from 1) minor injuries such as scratches, bruises, and sprains, to 2) major injuries such as eye injury, joint or bone injuries, heart attacks, and concussions, to 3) catastrophic injuries such as paralysis and death.',
          ],
        },
        {
          heading: 'Indemnification and Hold Harmless',
          paragraphs: [
            'I also agree to indemnify and hold The Releasees harmless from any and all claims, actions, suits, procedures, costs, expenses, damages and liabilities, including attorney’s fees, arising out of my involvement in The Activity, and to reimburse it for any such expenses incurred.',
          ],
        },
        {
          heading: 'Severability',
          paragraphs: [
            'I further agree that this Waiver of Liability, Assumption of Risk, and Indemnity Agreement is intended to be as broad and inclusive as permitted by law, and that if any portion is held invalid the remaining portions will continue to have full legal force and effect.',
          ],
        },
        {
          heading: 'Governing Law and Jurisdiction',
          paragraphs: [
            'This Agreement shall be governed by the laws of the State of California, and any disputes arising out of or in connection with this Agreement shall be under the exclusive jurisdiction of the Courts of the State of California.',
          ],
        },
        {
          heading: 'Acknowledgment of Understanding',
          paragraphs: [
            'I have read this Waiver of Liability, Assumption of Risk, and Indemnity Agreement, fully understand its terms, and understand that I am giving up substantial rights, including my right to sue. I confirm that I am signing the agreement freely and voluntarily, and intend my signature to be a complete and unconditional release of all liability to the greatest extent allowed by law.',
            'If the participant is a minor, the parent or legal guardian agrees to the waiver on behalf of the participant.',
          ],
        },
      ],
    },
    {
      id: 'media',
      title: 'Media Release and Authorization',
      subtitle: EVENT.eventName,
      summary:
        'This authorizes event-related photography, video, audio, livestream, and promotional use connected to the hackathon.',
      guardianNote: isMinor
        ? 'Because the participant is under 18, the parent or legal guardian must also consent to the media release.'
        : 'Parent or legal guardian consent is only required if the participant is under 18.',
      sections: [
        {
          heading: 'Authorization',
          paragraphs: [
            `I authorize ${EVENT.organizationName} and the ${EVENT.eventName} organizers to photograph, film, record, livestream, or otherwise capture my participation in the event, including my name, likeness, image, voice, statements, project demonstrations, and team participation.`,
          ],
        },
        {
          heading: 'Permitted Uses',
          paragraphs: [
            `I grant permission for those recordings and materials to be used, edited, reproduced, published, displayed, distributed, and archived for event operations, recap materials, educational content, websites, social media, press coverage, sponsor updates, and future promotion of ${EVENT.eventName} and related programming.`,
          ],
        },
        {
          heading: 'No Compensation or Prior Approval',
          paragraphs: [
            'I understand that I will not receive compensation for the authorized use of these materials unless a separate written agreement states otherwise. I also understand that I may not be able to inspect or approve every finished use before publication, except as may be required by law.',
          ],
        },
        {
          heading: 'Participant Responsibility',
          paragraphs: [
            'I understand that I should not disclose confidential, proprietary, or otherwise restricted materials during any interview, demonstration, or recording unless I have permission to do so.',
          ],
        },
        {
          heading: 'Future Use Requests',
          paragraphs: [contactLine],
        },
        {
          heading: 'Release',
          paragraphs: [
            `To the extent permitted by law, I release ${EVENT.organizationName} and the ${EVENT.eventName} organizers from claims arising out of the authorized use of these recordings and materials.`,
          ],
        },
      ],
    },
  ];
}

export function getWaiverChecklist() {
  return [
    {
      field: 'acceptLiability',
      label: 'I have read and agree to the liability waiver.',
    },
    {
      field: 'acceptMedia',
      label: 'I have read and agree to the media waiver.',
    },
    {
      field: 'acceptElectronic',
      label: 'I consent to electronic records and electronic signatures for this waiver packet.',
    },
  ];
}
