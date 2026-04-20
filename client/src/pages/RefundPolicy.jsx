import React from 'react';
import LegalPageLayout from '../components/LegalPageLayout';

export default function RefundPolicy() {
    return (
        <LegalPageLayout eyebrow="Support" title="Refund Policy" lastUpdated="Apr 20, 2026">
            <p className="text-sm leading-6 text-gray-600">
                This page explains how refunds are handled in Vireon. Replace with your final policy and regulatory disclosures for
                production.
            </p>

            <section>
                <h2 className="text-lg font-bold text-gray-900">Refund eligibility</h2>
                <p>
                    Eligibility depends on the event and payment method. Some events may be non-refundable. If an event is cancelled
                    by the organizer, a refund may be issued where applicable.
                </p>
            </section>
            <section>
                <h2 className="text-lg font-bold text-gray-900">How to request a refund</h2>
                <p>
                    Contact support with your <span className="font-semibold">booking ID</span>, event name, and the email used for
                    payment. Our team will verify and process the request.
                </p>
            </section>
            <section>
                <h2 className="text-lg font-bold text-gray-900">Processing time</h2>
                <p>
                    Refund processing time varies by payment provider. Typical timelines range from 3–10 business days after
                    approval.
                </p>
            </section>
            <section>
                <h2 className="text-lg font-bold text-gray-900">Support</h2>
                <p>
                    Email <span className="font-semibold">support@vireon.com</span> for help.
                </p>
            </section>
        </LegalPageLayout>
    );
}

