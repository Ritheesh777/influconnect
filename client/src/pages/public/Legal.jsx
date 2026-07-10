import { Reveal } from '../../lib/motion.jsx';

export default function Legal({ kind = 'terms' }) {
  const doc = kind === 'terms' ? TERMS : PRIVACY;
  return (
    <div className="mx-auto max-w-3xl px-4 py-14">
      <Reveal>
        <h1 className="text-3xl font-bold text-ink-950 sm:text-4xl">{doc.title}</h1>
        <p className="mt-2 text-sm text-ink-400">Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
        <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          This is a plain-language template tailored to InfluConnect. Have a qualified lawyer
          review and adapt it to your jurisdiction before you go live.
        </div>
      </Reveal>

      <div className="mt-8 space-y-8">
        {doc.sections.map((s, i) => (
          <Reveal key={s.h} delay={i * 0.03}>
            <section>
              <h2 className="text-xl font-semibold text-ink-900">{i + 1}. {s.h}</h2>
              <div className="mt-2 space-y-3 text-[15px] leading-relaxed text-ink-600">
                {s.p.map((para, j) => (
                  <p key={j}>{para}</p>
                ))}
              </div>
            </section>
          </Reveal>
        ))}
        <p className="text-sm text-ink-400">
          Questions about this document? Contact us at <span className="font-medium text-ink-600">support@influconnect.com</span>.
        </p>
      </div>
    </div>
  );
}

const TERMS = {
  title: 'Terms & Conditions',
  sections: [
    {
      h: 'Acceptance of Terms',
      p: [
        'Welcome to InfluConnect ("the Platform", "we", "us"). By creating an account or using the Platform, you agree to these Terms & Conditions and our Privacy Policy. If you do not agree, please do not use the Platform.',
        'You must be at least 18 years old, or the age of majority in your jurisdiction, to use InfluConnect.',
      ],
    },
    {
      h: 'What InfluConnect Is',
      p: [
        'InfluConnect is a marketplace that helps businesses ("Companies") and content creators ("Creators") discover one another, communicate, and arrange collaborations. We provide discovery, messaging, reviews, and moderation tools.',
        'We are a neutral venue. We are not a party to any agreement, deliverable, or transaction between a Company and a Creator, and we do not employ Creators or act as an agent for either side.',
      ],
    },
    {
      h: 'Payments Are Handled Off-Platform',
      p: [
        'InfluConnect does not process payments in this version. Any fees, payment terms, deliverables, timelines, and refunds are agreed and settled privately between the Company and the Creator, outside the Platform.',
        'You are solely responsible for your own payment arrangements, invoicing, and any taxes arising from your collaborations. InfluConnect is not liable for non-payment, non-delivery, or any dispute arising from an off-platform arrangement.',
      ],
    },
    {
      h: 'Your Account',
      p: [
        'You are responsible for the accuracy of the information you provide, for keeping your password secure, and for all activity under your account. Notify us immediately of any unauthorized use.',
        'You agree to provide truthful profile and audience information. Misrepresenting follower counts, engagement, or identity is a breach of these Terms.',
      ],
    },
    {
      h: 'Acceptable Use',
      p: [
        'You agree not to: post false, misleading, unlawful, hateful, or infringing content; harass or abuse other users; scrape or misuse data; attempt to bypass security; use the Platform to distribute spam or malware; or solicit users for purposes unrelated to legitimate collaboration.',
        'We may remove content and suspend or terminate accounts that violate these rules, at our discretion.',
      ],
    },
    {
      h: 'Content & Intellectual Property',
      p: [
        'You retain ownership of the content you upload (profiles, portfolios, media kits, messages). By posting it, you grant InfluConnect a limited, non-exclusive licence to host and display that content for the purpose of operating the Platform.',
        'You must have the rights to everything you upload. Do not post content you do not own or have permission to use.',
      ],
    },
    {
      h: 'Reviews & Reputation',
      p: [
        'Reviews must reflect genuine, first-hand collaboration experiences. Fake, incentivised, retaliatory, or defamatory reviews are prohibited and may be removed.',
        'Reviews represent the opinion of the author, not of InfluConnect.',
      ],
    },
    {
      h: 'Moderation & Complaints',
      p: [
        'We operate a complaint and moderation system. We may investigate reports, request evidence, and apply actions ranging from warnings to permanent bans. We aim to be fair but do not guarantee any particular outcome or timeframe.',
      ],
    },
    {
      h: 'Disclaimers & Limitation of Liability',
      p: [
        'The Platform is provided "as is" without warranties of any kind. We do not guarantee that collaborations will be successful, that users are who they claim to be, or that the service will be uninterrupted or error-free.',
        'To the maximum extent permitted by law, InfluConnect is not liable for any indirect, incidental, or consequential damages, or for any losses arising from off-platform arrangements between users.',
      ],
    },
    {
      h: 'Termination',
      p: [
        'You may delete your account at any time from Settings. We may suspend or terminate accounts that breach these Terms or that create risk for other users or the Platform.',
      ],
    },
    {
      h: 'Changes to These Terms',
      p: [
        'We may update these Terms from time to time. Material changes will be notified in-app or by email. Continued use after changes take effect constitutes acceptance.',
      ],
    },
    {
      h: 'Governing Law',
      p: [
        'These Terms are governed by the laws of the jurisdiction in which InfluConnect operates. Insert your governing law and dispute-resolution venue here before launch.',
      ],
    },
  ],
};

const PRIVACY = {
  title: 'Privacy Policy',
  sections: [
    {
      h: 'Overview',
      p: [
        'This Privacy Policy explains what information InfluConnect collects, how we use it, and the choices you have. We collect only what we need to run the marketplace and connect you with relevant partners.',
      ],
    },
    {
      h: 'Information We Collect',
      p: [
        'Account information: name or company name, username, email, phone, password (stored only as a secure hash), and role.',
        'Profile information: bio, description, location, industry/category, website, logo/banner or avatar, social handles and self-reported audience metrics, portfolio items and media kits.',
        'Activity information: campaigns, applications, invitations, collaborations, messages, reviews, complaints, and notifications generated as you use the Platform.',
        'Technical information: basic device/browser data and log data needed to operate and secure the service.',
      ],
    },
    {
      h: 'How We Use Your Information',
      p: [
        'To create and manage your account; to power search, matching, applications, and messaging; to display reputation and reviews; to send service and notification emails you have enabled; and to moderate the Platform and enforce our Terms.',
      ],
    },
    {
      h: 'How Information Is Shared',
      p: [
        'Your public profile, portfolio, and reviews are visible to other users so collaborations can happen. Messages are visible to the participants of a conversation.',
        'We do not sell your personal data. We share data only with service providers that help us run the Platform (for example, media hosting) and where required by law.',
      ],
    },
    {
      h: 'Third-Party Services',
      p: [
        'We use Cloudinary to store and deliver uploaded images, videos, and documents. Social account metrics you enter are self-reported; a future version may use official platform APIs (with your consent) to verify them.',
      ],
    },
    {
      h: 'Passwords & Security',
      p: [
        'Passwords are hashed and never stored in plain text. We never ask for, or store, the passwords to your social media accounts. We use reasonable technical and organizational measures to protect your data, though no system is perfectly secure.',
      ],
    },
    {
      h: 'Data Retention',
      p: [
        'We keep your information for as long as your account is active. When you delete your account, we remove or anonymize your personal data, except where we must retain it to comply with legal obligations or resolve disputes.',
      ],
    },
    {
      h: 'Your Rights',
      p: [
        'You can access and update your profile at any time, control notification preferences, and delete your account from Settings. Depending on your jurisdiction, you may have additional rights to access, correct, export, or erase your data — contact us to exercise them.',
      ],
    },
    {
      h: 'Children',
      p: [
        'InfluConnect is not intended for anyone under 18, and we do not knowingly collect data from children.',
      ],
    },
    {
      h: 'Contact',
      p: [
        'For any privacy question or request, contact us at privacy@influconnect.com.',
      ],
    },
  ],
};
