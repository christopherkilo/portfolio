#!/usr/bin/env python3
"""
Generate public/Christopher_Kilo_Resume.pdf from the same content as lib/resume.ts.

Keep this script aligned with lib/resume.ts + SITE contact fields in lib/constants.ts.
Do not invent experience, metrics, or credentials here.

Usage:
  python3 scripts/generate-resume-pdf.py
"""

from __future__ import annotations

from pathlib import Path

from fpdf import FPDF
from fpdf.enums import XPos, YPos

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "public" / "Christopher_Kilo_Resume.pdf"

# Contact fields must match lib/constants.ts + lib/resume.ts.
NAME = "CHRISTOPHER KILO"
TITLE = "Full-Stack Developer"
LOCATION = "DeSoto, TX"
EMAIL = "christopherkilo.pro@gmail.com"
SITE_URL = "www.christopherkilo.com"
GITHUB = "github.com/christopherkilo"
LINKEDIN = "linkedin.com/in/christopher-kilo-312467425"

PROFILE = (
    "I build responsive web apps that pair clean interfaces with practical backend "
    "architecture - Next.js, React, TypeScript, PostgreSQL, Prisma, and Supabase. "
    "CompTIA A+ certified, with an IT and design background that keeps troubleshooting "
    "and UX in the same toolkit."
)

SKILLS = [
    ("Frontend", "React | Next.js | TypeScript | JavaScript | Tailwind CSS | Framer Motion"),
    ("Backend / Data", "PostgreSQL | Prisma | Supabase | Auth.js | REST APIs | Zod"),
    ("Design & Tools", "UI/UX | Figma | Git | GitHub | VS Code"),
    (
        "IT",
        "CompTIA A+ | PC diagnostics | Hardware repair | Networking fundamentals | Technical support",
    ),
]

PROJECTS = [
    (
        "Event Horizon",
        "Next.js | TypeScript | PostgreSQL | Prisma | Auth.js",
        "Event discovery with Auth.js, PostgreSQL, and transactional ticket holds - "
        "idempotent reservations and inventory that cannot go negative.",
    ),
    (
        "NovaTech Solutions",
        "Next.js | TypeScript | HubSpot | Resend",
        "Managed-IT marketing site with a real lead path: validation, Turnstile, HubSpot, "
        "and Resend - built for conversion, not just polish.",
    ),
    (
        "TaskFlow",
        "Next.js | TypeScript | Supabase | TanStack Query",
        "Collaborative workspace on Supabase with RLS, conflict detection, realtime "
        "invalidation, and an offline mutation outbox.",
    ),
]

EXPERIENCE = (
    "Customer Service Representative  |  Circle K",
    "Aug 2022 - Nov 2023",
    "Supported customers in a high-volume retail environment - resolving issues quickly, "
    "balancing priorities, and collaborating to keep service quality high.",
)

EDUCATION = [
    ("Davis Technical College", "Web & Graphic Design | July 2025 - May 2026"),
    ("Clearfield Job Corps Center", "Computer Technician Program | August 2024 - June 2025"),
]

# Intentional wrap: keep the full cabling credential readable on its own line.
CERT_LINE_1 = (
    "CompTIA A+  |  Web and Graphic Design  |  Introduction to Telecommunications"
)
CERT_LINE_2 = "Introduction to Network Cabling (Copper-Based Systems)"


class ResumePDF(FPDF):
    def footer(self) -> None:
        self.set_y(-12)
        self.set_font("Helvetica", "", 7.5)
        self.set_text_color(130, 130, 130)
        self.cell(0, 8, f"{SITE_URL}  |  Christopher Kilo", align="C")


def main() -> None:
    pdf = ResumePDF(format="Letter")
    pdf.set_auto_page_break(auto=True, margin=16)
    pdf.add_page()
    pdf.set_left_margin(0.7 * 25.4)
    pdf.set_right_margin(0.7 * 25.4)
    pdf.set_x(pdf.l_margin)

    width = pdf.epw
    left = pdf.l_margin

    def rule() -> None:
        pdf.set_draw_color(210, 210, 210)
        pdf.set_line_width(0.3)
        y = pdf.get_y()
        pdf.line(left, y, left + width, y)
        pdf.ln(4)

    def section(title: str) -> None:
        pdf.ln(2.5)
        pdf.set_x(left)
        pdf.set_font("Helvetica", "B", 9.5)
        pdf.set_text_color(18, 18, 18)
        pdf.cell(0, 5.5, title.upper())
        pdf.ln(5.5)
        rule()

    # Header
    pdf.set_font("Helvetica", "B", 20)
    pdf.set_text_color(15, 15, 15)
    pdf.cell(0, 9, NAME)
    pdf.ln(7)
    pdf.set_font("Helvetica", "", 11)
    pdf.set_text_color(55, 55, 55)
    pdf.cell(0, 5.5, TITLE)
    pdf.ln(5.5)
    pdf.set_font("Helvetica", "", 8.5)
    pdf.set_text_color(90, 90, 90)
    pdf.set_x(left)
    pdf.multi_cell(
        width,
        4.5,
        f"{LOCATION}  |  {EMAIL}  |  {SITE_URL}",
    )
    pdf.set_x(left)
    pdf.multi_cell(
        width,
        4.5,
        f"{LINKEDIN}  |  {GITHUB}",
    )
    pdf.ln(1.5)
    rule()

    section("Profile")
    pdf.set_x(left)
    pdf.set_font("Helvetica", "", 9.5)
    pdf.set_text_color(40, 40, 40)
    pdf.multi_cell(width, 4.8, PROFILE)

    section("Skills")
    for label, body in SKILLS:
        pdf.set_x(left)
        pdf.set_font("Helvetica", "B", 9)
        pdf.set_text_color(30, 30, 30)
        pdf.cell(34, 4.8, label)
        pdf.set_font("Helvetica", "", 9)
        pdf.set_text_color(50, 50, 50)
        pdf.multi_cell(width - 34, 4.8, body)
        pdf.ln(0.8)

    section("Selected Projects")
    for title, tech, summary in PROJECTS:
        pdf.set_x(left)
        pdf.set_font("Helvetica", "B", 10)
        pdf.set_text_color(20, 20, 20)
        pdf.cell(0, 5, title)
        pdf.ln(4.5)
        pdf.set_x(left)
        pdf.set_font("Helvetica", "", 8)
        pdf.set_text_color(100, 100, 100)
        pdf.cell(0, 4, tech)
        pdf.ln(4.5)
        pdf.set_x(left)
        pdf.set_font("Helvetica", "", 9)
        pdf.set_text_color(45, 45, 45)
        pdf.multi_cell(width, 4.6, summary)
        pdf.ln(2)

    section("Experience")
    role, dates, summary = EXPERIENCE
    pdf.set_x(left)
    pdf.set_font("Helvetica", "B", 10)
    pdf.set_text_color(20, 20, 20)
    pdf.cell(0, 5, role)
    pdf.ln(4.5)
    pdf.set_x(left)
    pdf.set_font("Helvetica", "", 8)
    pdf.set_text_color(100, 100, 100)
    pdf.cell(0, 4, dates)
    pdf.ln(4.5)
    pdf.set_x(left)
    pdf.set_font("Helvetica", "", 9)
    pdf.set_text_color(45, 45, 45)
    pdf.multi_cell(width, 4.6, summary)

    section("Education")
    for school, detail in EDUCATION:
        pdf.set_x(left)
        pdf.set_font("Helvetica", "B", 9.5)
        pdf.set_text_color(25, 25, 25)
        pdf.cell(0, 5, school)
        pdf.ln(4.5)
        pdf.set_x(left)
        pdf.set_font("Helvetica", "", 9)
        pdf.set_text_color(55, 55, 55)
        pdf.cell(0, 4, detail)
        pdf.ln(5.5)

    section("Certifications")
    pdf.set_font("Helvetica", "", 9)
    pdf.set_text_color(40, 40, 40)
    pdf.set_x(left)
    pdf.cell(
        0,
        4.6,
        CERT_LINE_1,
        new_x=XPos.LMARGIN,
        new_y=YPos.NEXT,
    )
    pdf.set_x(left)
    pdf.cell(
        0,
        4.6,
        CERT_LINE_2,
        new_x=XPos.LMARGIN,
        new_y=YPos.NEXT,
    )

    if pdf.page_no() != 1:
        raise SystemExit(f"Resume exceeded one page ({pdf.page_no()} pages).")

    OUT.parent.mkdir(parents=True, exist_ok=True)
    pdf.output(OUT)
    print(f"wrote {OUT} ({OUT.stat().st_size} bytes, 1 page)")


if __name__ == "__main__":
    main()
