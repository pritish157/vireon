import React from 'react';
import LegalPageLayout from '../components/LegalPageLayout';

export default function Terms() {
    return (
        <LegalPageLayout eyebrow="Legal" title="Terms of Service" lastUpdated="Apr 20, 2026">
            <p className="text-sm leading-6 text-gray-600">
                These Terms apply to your use of Vireon. Replace this content with your final production policy before deployment.
            </p>

            <section>
                <h2 className="text-lg font-bold text-gray-900">1. Accounts</h2>
                <p>
                    You are responsible for maintaining the confidentiality of your account credentials and for all activity under
                    your account.
                </p>
            </section>
            <section>
                <h2 className="text-lg font-bold text-gray-900">2. Event Listings & Accuracy</h2>
                <p>
                    Event details are provided by organizers and may change. Vireon does not guarantee the accuracy of event content
                    and may remove listings that violate policies.
                </p>
            </section>
            <section>
                <h2 className="text-lg font-bold text-gray-900">3. Payments & Refunds</h2>
                <p>
                    Payment processing and refund eligibility depends on the event and payment method. See the Refund Policy page
                    for operational guidance.
                </p>
            </section>
            <section>
                <h2 className="text-lg font-bold text-gray-900">4. Prohibited Use</h2>
                <p>You agree not to misuse the platform, attempt unauthorized access, or upload malicious content.</p>
            </section>
            <section>
                <h2 className="text-lg font-bold text-gray-900">5. Contact</h2>
                <p>
                    For support, email <span className="font-semibold">support@vireon.com</span>.
                </p>
            </section>
        </LegalPageLayout>
    );
}

