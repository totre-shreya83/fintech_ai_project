from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse, JSONResponse
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import csv
import os
import json
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
import io
import tempfile

from database import get_db
import models
from routes.auth import get_current_user

# ✅ ROUTER DEFINITION
router = APIRouter(prefix="/reports", tags=["reports"])

# 📊 CSV EXPORT
@router.get("/csv")
async def export_csv(
    days: int = 7,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Export events to CSV"""
    
    try:
        # Get events from last X days
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        events = db.query(models.NewsEvent).filter(
            models.NewsEvent.published_at >= cutoff_date
        ).order_by(models.NewsEvent.published_at.desc()).all()
        
        # Create CSV in memory
        output = io.StringIO()
        writer = csv.writer(output)
        
        # Write header
        writer.writerow([
            'Title', 'Source', 'Event Type', 'Risk Level', 
            'Confidence', 'Published Date', 'Impact Duration', 'Alert Sent'
        ])
        
        # Write data
        for event in events:
            writer.writerow([
                event.title or '',
                event.source or '',
                event.event_type or '',
                event.risk_level or '',
                f"{event.event_type_confidence * 100:.1f}%" if event.event_type_confidence else 'N/A',
                event.published_at.strftime('%Y-%m-%d %H:%M') if event.published_at else 'N/A',
                event.impact_duration or '',
                'Yes' if event.is_alert_sent else 'No'
            ])
        
        # Return as file
        filename = f"risk_events_{datetime.utcnow().strftime('%Y%m%d_%H%M')}.csv"
        
        return JSONResponse({
            "success": True,
            "filename": filename,
            "data": output.getvalue(),
            "count": len(events)
        })
    except Exception as e:
        return JSONResponse({
            "success": False,
            "error": str(e)
        })

# 📄 PDF EXPORT
@router.get("/pdf")
async def export_pdf(
    days: int = 7,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Export events to PDF with charts"""
    
    try:
        # Get events
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        events = db.query(models.NewsEvent).filter(
            models.NewsEvent.published_at >= cutoff_date
        ).order_by(models.NewsEvent.published_at.desc()).all()
        
        # Get stats
        total = len(events)
        critical = sum(1 for e in events if e.risk_level == 'critical')
        high = sum(1 for e in events if e.risk_level == 'high')
        medium = sum(1 for e in events if e.risk_level == 'medium')
        low = sum(1 for e in events if e.risk_level == 'low')
        
        # Create PDF
        filename = f"risk_report_{datetime.utcnow().strftime('%Y%m%d_%H%M')}.pdf"
        filepath = os.path.join(tempfile.gettempdir(), filename)
        
        doc = SimpleDocTemplate(filepath, pagesize=letter)
        styles = getSampleStyleSheet()
        elements = []
        
        # Title
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=24,
            spaceAfter=30,
            textColor=colors.HexColor('#1976d2')
        )
        elements.append(Paragraph("Financial Risk Intelligence Report", title_style))
        
        # Date
        date_style = ParagraphStyle(
            'Date',
            parent=styles['Normal'],
            fontSize=12,
            textColor=colors.gray,
            spaceAfter=20
        )
        elements.append(Paragraph(f"Generated: {datetime.utcnow().strftime('%B %d, %Y at %H:%M')} UTC", date_style))
        
        # User Info
        elements.append(Paragraph(f"Report for: {current_user.name} ({current_user.email})", styles['Normal']))
        elements.append(Spacer(1, 20))
        
        # Summary Stats
        summary_style = ParagraphStyle(
            'Summary',
            parent=styles['Heading2'],
            fontSize=16,
            spaceAfter=10,
            textColor=colors.HexColor('#1976d2')
        )
        elements.append(Paragraph("Executive Summary", summary_style))
        
        stats_data = [
            ["Metric", "Value"],
            ["Total Events", str(total)],
            ["Critical Risk", str(critical)],
            ["High Risk", str(high)],
            ["Medium Risk", str(medium)],
            ["Low Risk", str(low)],
            ["Time Period", f"Last {days} days"],
        ]
        
        stats_table = Table(stats_data, colWidths=[2*inch, 1.5*inch])
        stats_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1976d2')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 12),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('TEXTCOLOR', (0, 1), (-1, -1), colors.black),
            ('FONTSIZE', (0, 1), (-1, -1), 11),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
        ]))
        elements.append(stats_table)
        elements.append(Spacer(1, 30))
        
        # Recent Events Table
        elements.append(Paragraph("Recent Events", summary_style))
        
        table_data = [['Title', 'Source', 'Event Type', 'Risk Level', 'Date']]
        for event in events[:15]:  # Top 15 events
            table_data.append([
                event.title[:50] + '...' if len(event.title) > 50 else event.title,
                event.source[:20] if event.source else 'N/A',
                event.event_type or 'N/A',
                event.risk_level or 'N/A',
                event.published_at.strftime('%Y-%m-%d') if event.published_at else 'N/A'
            ])
        
        events_table = Table(table_data, colWidths=[2.2*inch, 1.2*inch, 1*inch, 0.8*inch, 1*inch])
        events_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1976d2')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 10),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.white),
            ('TEXTCOLOR', (0, 1), (-1, -1), colors.black),
            ('FONTSIZE', (0, 1), (-1, -1), 9),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.lightgrey),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.lightgrey]),
        ]))
        elements.append(events_table)
        
        # Footer
        elements.append(Spacer(1, 30))
        footer_text = f"Report generated by Financial Risk Intelligence Platform • {datetime.utcnow().strftime('%Y-%m-%d')}"
        elements.append(Paragraph(footer_text, styles['Italic']))
        
        # Build PDF
        doc.build(elements)
        
        return FileResponse(
            filepath,
            media_type='application/pdf',
            filename=filename
        )
    except Exception as e:
        return JSONResponse({
            "success": False,
            "error": str(e)
        })

# 📅 SCHEDULED REPORTS
@router.get("/scheduled")
async def get_scheduled_reports(
    current_user: models.User = Depends(get_current_user)
):
    """Get user's scheduled reports"""
    
    # For now, return empty list
    # In production, this would fetch from database
    return {
        "success": True,
        "schedules": []
    }

# 📅 CREATE SCHEDULE
@router.post("/schedule")
async def schedule_report(
    report_data: dict,
    current_user: models.User = Depends(get_current_user)
):
    """Schedule recurring reports"""
    
    try:
        # Get schedule parameters
        report_type = report_data.get('type', 'pdf')
        frequency = report_data.get('frequency', 'daily')
        email = report_data.get('email', current_user.email)
        days = report_data.get('days', 7)
        
        # In production, this would save to database
        # and set up actual email scheduling
        
        return {
            "success": True,
            "message": f"Report scheduled: {frequency}",
            "schedule": {
                "type": report_type,
                "frequency": frequency,
                "email": email,
                "days": days,
                "active": True
            }
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

# ❌ DELETE SCHEDULE
@router.delete("/schedule/{frequency}")
async def delete_schedule(
    frequency: str,
    current_user: models.User = Depends(get_current_user)
):
    """Delete scheduled report"""
    
    try:
        # In production, this would remove from database
        return {
            "success": True,
            "message": f"Schedule {frequency} deleted"
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }