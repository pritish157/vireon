import React from 'react';
import LegalPageLayout from '../components/LegalPageLayout';

export default function Privacy() {
    return (
        <LegalPageLayout eyebrow="Legal" title="Privacy Policy" lastUpdated="Apr 20, 2026">
            <p className="text-sm leading-6 text-gray-600">
                This is a starter privacy policy page. Replace with your final production wording before launch.
            </p>

            <section>
                <h2 className="text-lg font-bold text-gray-900">Data we collect</h2>
                <p>
                    Account details (name, email), booking history, and location preferences (state/district/city) when you choose
                    to provide them.
                </p>
            </section>
            <section>
                <h2 className="text-lg font-bold text-gray-900">How we use data</h2>
                <p>
                    To authenticate you, process bookings, improve event discovery (including location-based results), and provide
                    support.
                </p>
            </section>
            <section>
                <h2 className="text-lg font-bold text-gray-900">Data sharing</h2>
                <p>
                    We may share limited details with event organizers when required to fulfill bookings and with payment
                    processors to complete transactions.
                </p>
            </section>
            <section>
                <h2 className="text-lg font-bold text-gray-900">Contact</h2>
                <p>
                    Questions? Email <span className="font-semibold">privacy@vireon.com</span>.
                </p>
            </section>
        </LegalPageLayout>
    );
}

