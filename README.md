# Nogueira-Cardiologia-Digital-Platform
Nogueira Cardiologia’s digital platform: authority website, SEO blog, patient portal, mobile app, online scheduling, PIX payments, insurance workflow, and exam upload system.

# Nogueira Cardiologia Digital Platform

## EN

### Overview

This project is a complete digital platform for **Nogueira Cardiologia**, designed to strengthen the clinic’s online authority and improve the patient experience through a modern website and mobile app ecosystem.

The platform will include:

- A high-authority institutional website
- A medical blog focused on SEO and organic growth
- A patient portal on the website
- A mobile app for patients
- Online appointment scheduling
- PIX payment support
- Health insurance / medical plan indication during scheduling
- Exam and medical document upload area
- Patient account with appointment and exam history

The main goal is to deliver a modern, scalable, professional, and patient-friendly platform for one of the most respected cardiology brands in Brazil.

---

## Project Goals

### Business Goals

- Strengthen the digital authority of Nogueira Cardiologia
- Improve patient acquisition through SEO and strong online positioning
- Reduce receptionist dependency for appointment scheduling
- Improve patient convenience and speed during the scheduling process
- Create a centralized digital experience for appointments, payments, exams, and follow-up

### Product Goals

- Build a professional website with strong credibility and authority
- Offer self-service scheduling for patients
- Allow users to register, log in, and manage appointments
- Enable patients to upload exam results inside their account
- Support PIX payments and health insurance workflow
- Prepare the platform for future integrations and scale

---

## Planned Features

### Institutional Website

- Home page
- About the clinic
- About the doctors
- Specialties
- Exams / services
- Health plans / insurance
- Contact page
- WhatsApp contact buttons
- Strong calls to action for scheduling
- Patient access / login entry point

### Medical Blog

- SEO-focused blog structure
- Category pages
- Article pages
- Content strategy to increase authority and organic traffic
- Educational medical content
- Landing pages for specialties and important services

### Patient Portal (Web)

- Patient registration
- Login / authentication
- Password recovery
- Profile management
- View available dates and times
- Schedule consultations
- View scheduled appointments
- Cancel / reschedule appointments
- Upload exams and medical files
- Track consultation history

### Patient App (Mobile)

- Registration and login
- Appointment scheduling
- Appointment management
- PIX payment flow
- Health plan selection / information
- Upload exam results
- Notifications and reminders
- Access to patient history

### Payment and Insurance Flow

- PIX payment integration
- Health insurance / medical plan indication during booking
- Separation of private appointment flow vs insurance-based flow
- Future support for billing and financial automation

### Exams and Documents

- Upload exam results
- Upload requested medical files
- Secure association of documents to the patient account
- Future doctor-side review workflow

---

## Suggested MVP

To deliver the project in a practical and realistic timeframe, the suggested MVP is:

- Institutional website
- Blog structure
- Patient registration
- Login
- Specialty listing
- Doctor listing
- Available schedule visualization
- Appointment scheduling
- My appointments area
- PIX payment option
- Health plan indication
- Exam upload area

This MVP provides a strong first delivery while keeping room for future expansion.

---

## Suggested Tech Stack

### Frontend

- **Next.js** for the website and patient web portal
- Responsive UI
- SEO-first structure

### Backend

- **NestJS** for API and business rules
- JWT authentication
- Secure file upload handling

### Database

- **PostgreSQL**

### Infrastructure

- **VPS**
- **EasyPanel**
- **Docker**
- **GitHub**
- Domain and DNS management
- SSL / HTTPS

### Mobile App

Suggested options:

- **React Native (Expo)** for faster cross-platform development
- Native approach in the future if needed

---

## Suggested Project Structure

```bash
nogueira-cardiologia/
  apps/
    web/        # Institutional website + blog + patient portal
    mobile/     # Mobile patient app
    api/        # Backend API
  packages/
    ui/         # Shared UI components
    config/     # Shared configurations
    types/      # Shared types/interfaces
  infra/
    docker/
    scripts/
  docs/

