import io
import os
from datetime import datetime
from reportlab.lib.pagesizes import A4
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    HRFlowable,
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
import arabic_reshaper
from bidi.algorithm import get_display


def _shape_persian(text):
    """
    Reshapes and applies the Unicode bidirectional algorithm to Arabic/Persian text
    to prevent letter disconnects and text inversion in PDF rendering.
    """
    if not text:
        return ''
    try:
        reshaped = arabic_reshaper.reshape(str(text))
        return get_display(reshaped)
    except Exception:
        return str(text)


class PdfExportService:
    """
    Sub-module 6: PDF Document Generation Service.
    Uses ReportLab with Arabic reshaper and BiDi algorithm to compile
    structured report data into PDF documents with full RTL Persian support.
    """

    _font_initialized = False
    _font_name = 'Helvetica'

    @classmethod
    def _initialize_fonts(cls):
        if cls._font_initialized:
            return cls._font_name

        font_candidates = [
            os.path.join(os.environ.get('WINDIR', 'C:\\Windows'), 'Fonts', 'tahoma.ttf'),
            os.path.join(os.environ.get('WINDIR', 'C:\\Windows'), 'Fonts', 'arial.ttf'),
            '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
        ]

        for path in font_candidates:
            if os.path.exists(path):
                try:
                    font_name = os.path.splitext(os.path.basename(path))[0].capitalize()
                    pdfmetrics.registerFont(TTFont(font_name, path))
                    cls._font_name = font_name
                    cls._font_initialized = True
                    return font_name
                except Exception:
                    continue

        cls._font_initialized = True
        return cls._font_name

    @classmethod
    def generate_pdf(cls, report_type, report_data, student=None):
        """
        Compiles the report dictionary into a binary PDF buffer.
        """
        font_name = cls._initialize_fonts()
        buffer = io.BytesIO()

        doc = SimpleDocTemplate(
            buffer,
            pagesize=A4,
            rightMargin=36,
            leftMargin=36,
            topMargin=36,
            bottomMargin=36
        )

        styles = getSampleStyleSheet()

        title_style = ParagraphStyle(
            'ReportTitle',
            parent=styles['Heading1'],
            fontName=font_name,
            fontSize=16,
            leading=20,
            alignment=1, # Centered
            textColor=colors.HexColor('#1e293b')
        )

        subtitle_style = ParagraphStyle(
            'ReportSubtitle',
            parent=styles['Normal'],
            fontName=font_name,
            fontSize=10,
            leading=14,
            alignment=1,
            textColor=colors.HexColor('#64748b')
        )

        cell_style = ParagraphStyle(
            'TableCell',
            parent=styles['Normal'],
            fontName=font_name,
            fontSize=9,
            leading=12,
            alignment=1,
            textColor=colors.HexColor('#0f172a')
        )

        cell_header_style = ParagraphStyle(
            'TableHeaderCell',
            parent=styles['Normal'],
            fontName=font_name,
            fontSize=9,
            leading=12,
            alignment=1,
            textColor=colors.white
        )

        elements = []

        # 1. Header Banner
        title_text = _shape_persian(report_data.get('report_title', 'گزارش تحصیلی'))
        elements.append(Paragraph(title_text, title_style))
        elements.append(Spacer(1, 6))

        student_name = report_data.get('student_name', '')
        week_range = f"{report_data.get('week_start', '')} ~ {report_data.get('week_end', '')}"
        meta_text = _shape_persian(f"دانشجو: {student_name} | بازه زمانی: {week_range}")
        elements.append(Paragraph(meta_text, subtitle_style))
        elements.append(Spacer(1, 12))

        elements.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor('#cbd5e1'), spaceAfter=14))

        data = report_data.get('data', {})

        # 2. Body based on report type
        if report_type == 'weekly':
            elements.extend(cls._build_weekly_section(data, cell_style, cell_header_style))
        elif report_type == 'performed':
            elements.extend(cls._build_performed_section(data, cell_style, cell_header_style))
        elif report_type == 'conclusion':
            elements.extend(cls._build_conclusion_section(data, cell_style, cell_header_style))
        elif report_type == 'full':
            elements.extend(cls._build_full_section(data, cell_style, cell_header_style))

        # 3. Footer
        elements.append(Spacer(1, 20))
        gen_time = datetime.now().strftime('%Y-%m-%d %H:%M')
        footer_text = _shape_persian(f"سامانه هوشمند برنامه‌ریزی نصیر | تاریخ تولید: {gen_time}")
        elements.append(Paragraph(footer_text, subtitle_style))

        doc.build(elements)
        buffer.seek(0)
        return buffer.getvalue()

    @classmethod
    def _build_weekly_section(cls, data, cell_style, header_style):
        elements = []
        chapters = data.get('chapters', [])

        table_data = [
            [
                Paragraph(_shape_persian('مدت زمان (دقیقه)'), header_style),
                Paragraph(_shape_persian('عنوان فصل'), header_style),
                Paragraph(_shape_persian('کتاب / درس'), header_style),
                Paragraph(_shape_persian('ردیف'), header_style),
            ]
        ]

        for i, ch in enumerate(chapters, 1):
            table_data.append([
                Paragraph(str(ch.get('allocated_minutes', 0)), cell_style),
                Paragraph(_shape_persian(ch.get('chapter_title', '')), cell_style),
                Paragraph(_shape_persian(ch.get('source_material_title', '')), cell_style),
                Paragraph(str(i), cell_style),
            ])

        if len(table_data) == 1:
            table_data.append([
                Paragraph(_shape_persian('رکوردی ثبت نشده است'), cell_style),
                Paragraph('', cell_style),
                Paragraph('', cell_style),
                Paragraph('', cell_style),
            ])

        col_widths = [100, 180, 180, 40]
        t = Table(table_data, colWidths=col_widths)
        t.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#0284c7')),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#e2e8f0')),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f8fafc')]),
            ('TOPPADDING', (0, 0), (-1, -1), 6),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ]))
        elements.append(t)
        return elements

    @classmethod
    def _build_performed_section(cls, data, cell_style, header_style):
        elements = []
        chapters = data.get('chapters', [])

        # KPI Summary Table
        kpi_data = [
            [
                Paragraph(_shape_persian('تعداد کل تست‌ها'), header_style),
                Paragraph(_shape_persian('مدت کلاس'), header_style),
                Paragraph(_shape_persian('مدت مرور'), header_style),
                Paragraph(_shape_persian('مدت مطالعه'), header_style),
            ],
            [
                Paragraph(f"{data.get('total_tests', 0)}", cell_style),
                Paragraph(f"{data.get('total_class_time_minutes', 0)} دقیقه", cell_style),
                Paragraph(f"{data.get('total_review_time_minutes', 0)} دقیقه", cell_style),
                Paragraph(f"{data.get('total_read_time_minutes', 0)} دقیقه", cell_style),
            ]
        ]
        kpi_table = Table(kpi_data, colWidths=[125, 125, 125, 125])
        kpi_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#3b82f6')),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#cbd5e1')),
            ('TOPPADDING', (0, 0), (-1, -1), 6),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ]))
        elements.append(kpi_table)
        elements.append(Spacer(1, 14))

        # Chapters table
        table_data = [
            [
                Paragraph(_shape_persian('تعداد تست'), header_style),
                Paragraph(_shape_persian('کلاس (دقیقه)'), header_style),
                Paragraph(_shape_persian('مرور (دقیقه)'), header_style),
                Paragraph(_shape_persian('مطالعه (دقیقه)'), header_style),
                Paragraph(_shape_persian('فصل'), header_style),
                Paragraph(_shape_persian('کتاب / درس'), header_style),
                Paragraph(_shape_persian('ردیف'), header_style),
            ]
        ]

        for i, ch in enumerate(chapters, 1):
            table_data.append([
                Paragraph(str(ch.get('test_count', 0)), cell_style),
                Paragraph(str(ch.get('class_time_minutes', 0)), cell_style),
                Paragraph(str(ch.get('review_time_minutes', 0)), cell_style),
                Paragraph(str(ch.get('read_time_minutes', 0)), cell_style),
                Paragraph(_shape_persian(ch.get('chapter_title', '')), cell_style),
                Paragraph(_shape_persian(ch.get('source_material_title', '')), cell_style),
                Paragraph(str(i), cell_style),
            ])

        col_widths = [60, 60, 60, 60, 130, 100, 30]
        t = Table(table_data, colWidths=col_widths)
        t.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1d4ed8')),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#e2e8f0')),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f8fafc')]),
            ('TOPPADDING', (0, 0), (-1, -1), 5),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ]))
        elements.append(t)
        return elements

    @classmethod
    def _build_conclusion_section(cls, data, cell_style, header_style):
        elements = []
        chapters = data.get('chapters', [])

        # KPI Summary Table
        kpi_data = [
            [
                Paragraph(_shape_persian('درصد کل'), header_style),
                Paragraph(_shape_persian('میانگین تسلط'), header_style),
                Paragraph(_shape_persian('تست‌های نزده'), header_style),
                Paragraph(_shape_persian('تست‌های غلط'), header_style),
                Paragraph(_shape_persian('تست‌های درست'), header_style),
                Paragraph(_shape_persian('کل تست‌ها'), header_style),
            ],
            [
                Paragraph(f"{data.get('overall_percentage', 0)}%", cell_style),
                Paragraph(f"{data.get('average_mastery', 0)}%", cell_style),
                Paragraph(str(data.get('total_untested', 0)), cell_style),
                Paragraph(str(data.get('total_wrong', 0)), cell_style),
                Paragraph(str(data.get('total_correct', 0)), cell_style),
                Paragraph(str(data.get('total_tests', 0)), cell_style),
            ]
        ]
        kpi_table = Table(kpi_data, colWidths=[80, 85, 80, 80, 85, 90])
        kpi_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#059669')),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#cbd5e1')),
            ('TOPPADDING', (0, 0), (-1, -1), 6),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ]))
        elements.append(kpi_table)
        elements.append(Spacer(1, 14))

        # Chapters table
        table_data = [
            [
                Paragraph(_shape_persian('درصد'), header_style),
                Paragraph(_shape_persian('تسلط'), header_style),
                Paragraph(_shape_persian('نزده'), header_style),
                Paragraph(_shape_persian('غلط'), header_style),
                Paragraph(_shape_persian('درست'), header_style),
                Paragraph(_shape_persian('کل تست'), header_style),
                Paragraph(_shape_persian('فصل'), header_style),
                Paragraph(_shape_persian('کتاب'), header_style),
                Paragraph(_shape_persian('ردیف'), header_style),
            ]
        ]

        for i, ch in enumerate(chapters, 1):
            mastery_str = f"{ch.get('mastery_level')}%" if ch.get('mastery_level') is not None else '-'
            table_data.append([
                Paragraph(f"{ch.get('percentage', 0)}%", cell_style),
                Paragraph(mastery_str, cell_style),
                Paragraph(str(ch.get('untested_tests', 0)), cell_style),
                Paragraph(str(ch.get('wrong_tests', 0)), cell_style),
                Paragraph(str(ch.get('correct_tests', 0)), cell_style),
                Paragraph(str(ch.get('total_tests', 0)), cell_style),
                Paragraph(_shape_persian(ch.get('chapter_title', '')), cell_style),
                Paragraph(_shape_persian(ch.get('source_material_title', '')), cell_style),
                Paragraph(str(i), cell_style),
            ])

        col_widths = [50, 45, 45, 45, 45, 50, 110, 80, 30]
        t = Table(table_data, colWidths=col_widths)
        t.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#047857')),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#e2e8f0')),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f8fafc')]),
            ('TOPPADDING', (0, 0), (-1, -1), 5),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ]))
        elements.append(t)
        return elements

    @classmethod
    def _build_full_section(cls, data, cell_style, header_style):
        elements = []
        sch = data.get('scheduled_data', {})
        perf = data.get('performed_data', {})
        conc = data.get('conclusion_data', {})

        elements.extend(cls._build_performed_section(perf, cell_style, header_style))
        elements.append(Spacer(1, 16))
        elements.extend(cls._build_conclusion_section(conc, cell_style, header_style))
        return elements
