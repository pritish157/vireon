import React from 'react';
import jsPDF from 'jspdf';
import { FaDownload, FaCalendarAlt, FaMapMarkerAlt, FaBarcode } from 'react-icons/fa';

const TicketDownload = ({ booking, event, user }) => {
    const generatePDF = () => {
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();

        // Background color
        doc.setFillColor(59, 130, 246); // Blue
        doc.rect(0, 0, pageWidth, 60, 'F');

        // Header
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(24);
        doc.text('VIREON', 20, 25);
        doc.setFontSize(12);
        doc.text('Event Booking Ticket', 20, 35);

        // Ticket content
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(14);
        doc.text('Event Details', 20, 75);

        doc.setFontSize(11);
        doc.text(`Event: ${event.title}`, 20, 85);
        doc.text(`Category: ${event.category}`, 20, 92);
        doc.text(`Date: ${new Date(event.date).toLocaleDateString()}`, 20, 99);
        doc.text(`Location: ${event.location}`, 20, 106);
        doc.text(`Price: ${event.ticketPrice === 0 ? 'Free' : `₹${event.ticketPrice}`}`, 20, 113);

        // Booking Details
        doc.setFontSize(14);
        doc.text('Booking Details', 20, 130);

        doc.setFontSize(11);
        doc.text(`Booking ID: ${booking._id}`, 20, 140);
        doc.text(`Attendee: ${user.name}`, 20, 147);
        doc.text(`Email: ${user.email}`, 20, 154);
        doc.text(`Status: ${booking.status.toUpperCase()}`, 20, 161);
        doc.text(`Payment: ${booking.paymentStatus}`, 20, 168);

        // Barcode simulation
        doc.setFontSize(12);
        doc.text('Ticket Code:', 20, 185);
        doc.setFont(undefined, 'bold');
        doc.text(booking._id.substring(0, 20).toUpperCase(), 20, 195);

        // Footer
        doc.setFontSize(10);
        doc.setTextColor(128, 128, 128);
        doc.text('Please present this ticket at the event entrance', 20, pageHeight - 20);
        doc.text(`Generated on ${new Date().toLocaleDateString()}`, 20, pageHeight - 14);

        // Save
        doc.save(`Vireon_Ticket_${booking._id}.pdf`);
    };

    return (
        <button
            onClick={generatePDF}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition"
        >
            <FaDownload /> Download Ticket (PDF)
        </button>
    );
};

export default TicketDownload;
