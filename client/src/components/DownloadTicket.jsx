import React from 'react';
import jsPDF from 'jspdf';
import { FaDownload } from 'react-icons/fa';

const DownloadTicket = ({ booking, event }) => {
    const handleDownload = () => {
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();

        // Background
        doc.setFillColor(59, 130, 246); // Blue
        doc.rect(0, 0, pageWidth, 60, 'F');

        // Header
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(28);
        doc.text('VIREON', pageWidth / 2, 25, { align: 'center' });
        doc.setFontSize(10);
        doc.text('Event Ticket', pageWidth / 2, 45, { align: 'center' });

        // Ticket Details
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(14);
        doc.text('Event Details', 20, 80);

        doc.setFontSize(11);
        const details = [
            { label: 'Event Name:', value: event.title },
            { label: 'Date:', value: new Date(event.date).toLocaleDateString() },
            { label: 'Time:', value: '10:00 AM - 6:00 PM' },
            { label: 'Location:', value: event.location },
            { label: 'Category:', value: event.category },
            { label: 'Ticket Price:', value: event.ticketPrice === 0 ? 'Free' : `₹${event.ticketPrice}` }
        ];

        let yPos = 95;
        details.forEach(detail => {
            doc.setFont(undefined, 'bold');
            doc.text(detail.label, 20, yPos);
            doc.setFont(undefined, 'normal');
            doc.text(detail.value, 80, yPos);
            yPos += 10;
        });

        // Booking Details
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text('Booking Information', 20, yPos + 10);

        doc.setFont(undefined, 'normal');
        doc.setFontSize(11);
        const bookingDetails = [
            { label: 'Booking ID:', value: booking._id.slice(-8).toUpperCase() },
            { label: 'Status:', value: booking.status.toUpperCase() },
            { label: 'Payment:', value: booking.paymentStatus.toUpperCase() },
            { label: 'Booking Date:', value: new Date(booking.createdAt).toLocaleDateString() }
        ];

        yPos += 25;
        bookingDetails.forEach(detail => {
            doc.setFont(undefined, 'bold');
            doc.text(detail.label, 20, yPos);
            doc.setFont(undefined, 'normal');
            doc.text(detail.value, 80, yPos);
            yPos += 10;
        });

        // Footer
        doc.setTextColor(150, 150, 150);
        doc.setFontSize(9);
        doc.text('This is a digital ticket. Please keep it safe for event entry.', pageWidth / 2, pageHeight - 20, { align: 'center' });
        doc.text(`Downloaded on ${new Date().toLocaleString()}`, pageWidth / 2, pageHeight - 10, { align: 'center' });

        // Save PDF
        doc.save(`vireon-ticket-${booking._id.slice(-8)}.pdf`);
    };

    return (
        <button
            onClick={handleDownload}
            className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-600 hover:bg-green-200 rounded-lg font-semibold transition"
        >
            <FaDownload /> Download Ticket
        </button>
    );
};

export default DownloadTicket;
