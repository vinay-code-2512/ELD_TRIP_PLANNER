from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from reportlab.lib.units import inch
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from io import BytesIO

def generate_log_sheet_pdf(logs, trip_info=None):
    """
    Generate a PDF with log sheets for each day.
    
    Args:
        logs: List of dicts with 'day' and 'log' keys
        trip_info: Optional dict with trip information (current, pickup, dropoff)
    
    Returns:
        BytesIO object containing the PDF
    """
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter)
    elements = []
    styles = getSampleStyleSheet()
    
    # Title
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=18,
        textColor=colors.HexColor('#1a237e'),
        spaceAfter=30,
        alignment=1  # Center
    )
    elements.append(Paragraph("ELD Trip Log Sheets", title_style))
    
    # Trip info
    if trip_info:
        info_style = ParagraphStyle(
            'TripInfo',
            parent=styles['Normal'],
            fontSize=10,
            textColor=colors.gray,
            spaceAfter=20
        )
        info_text = f"Current: {trip_info.get('current', 'N/A')} | Pickup: {trip_info.get('pickup', 'N/A')} | Dropoff: {trip_info.get('dropoff', 'N/A')}"
        elements.append(Paragraph(info_text, info_style))
    
    # Status colors mapping
    status_colors = {
        'Off Duty': colors.gray,
        'Sleeper Berth': colors.blue,
        'Driving': colors.green,
        'On Duty (Not Driving)': colors.orange,
    }
    
    # Generate table for each day
    for day_log in logs:
        day = day_log.get('day', 1)
        log_entries = day_log.get('log', [])
        
        # Day header
        day_header = ParagraphStyle(
            'DayHeader',
            parent=styles['Heading2'],
            fontSize=14,
            textColor=colors.HexColor('#1a237e'),
            spaceBefore=20,
            spaceAfter=10
        )
        elements.append(Paragraph(f"Day {day}", day_header))
        
        # Create table data
        table_data = [['Time', 'Status']]

        for entry in log_entries:
            start = entry.get('start', '')
            end = entry.get('end', '')
            time_range = f"{start}-{end}" if start and end else ''
            status = entry.get('status', '')
            table_data.append([time_range, status])
        
        # Create table
        table = Table(table_data, colWidths=[2*inch, 4*inch])
        table_style = TableStyle([
            # Header row
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1a237e')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 12),
            
            # Data rows
            ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 1), (-1, -1), 10),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
        ])
        
        # Color rows based on status
        for i, entry in enumerate(log_entries, start=1):
            status = entry.get('status', '')
            if status in status_colors:
                table_style.add('BACKGROUND', (1, i), (1, i), status_colors[status])
        
        table.setStyle(table_style)
        elements.append(table)
        elements.append(Spacer(1, 0.5*inch))
    
    # Build PDF
    doc.build(elements)
    buffer.seek(0)
    return buffer
