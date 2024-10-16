# Clinic Information System

This project is a multi-page application (MPA) for a small clinic run by a doctor and a receptionist. It allows the receptionist to add new patient details and the doctor to manage patient medical records, with restricted access control to ensure that the receptionist does not have access to the medical records.

## Table of Contents

- [Project Structure](#project-structure)
- [Features](#features)
- [Technologies Used](#technologies-used)
- [Installation](#installation)
- [Usage](#usage)
- [Future Enhancements](#future-enhancements)

## Project Structure

clinic-info-system/
├── views/                  # Handlebars templates
│ ├── layout.hbs                # Main layout template
│ ├── login.hbs                 # Login page
│ ├── addPatient.hbs            # Receptionist page
│ ├── manageRecords.hbs         # Doctor page
├── data/                   # JSON files for storing data
│ ├── patients.json             # Patient data
├── public/                 # Static assets like CSS, images
│ └── style.css                 # CSS styles
├── app.js                  # Main application file
├── package.json            # npm config file
└── package-lock.json

## Features

- **Role-based Access Control**:
  - Receptionist can add new patient details.
  - Doctor can view and manage medical records.
  - The receptionist has no access to patient medical records.

- **Session-based Login**:
  - Login functionality is implemented using `express-session` to control access based on user roles (doctor or receptionist).

- **Local Data Storage**:
  - Patient details and medical records are stored in local JSON files for easy data management and retrieval.

- **Multi-page Application**:
  - Separate pages for login, adding patient details, and managing patient records.

## Technologies Used

- **Node.js**: Server-side JavaScript runtime.
- **Express.js**: Web application framework for Node.js.
- **Handlebars (hbs)**: Templating engine for rendering dynamic HTML.
- **express-session**: Session middleware for managing login sessions.
- **body-parser**: Middleware for parsing form data.
- **fs**: File system module to handle reading and writing JSON files.
- **CSS Framework**: Tailwind CSS (or any other framework like Bootstrap) for styling pages.

## Installation

To run this project locally:

1. Clone the repository:

    ```bash
        git clone git@github.com:OnsongoMabeya/Simple_hospital_management.git
    ```

2. Navigate to the project directory:

    ```bash
        cd Simple_hospital_management
    ```

3. Install dependencies:

    ```bash
        npm install
    ```

4. Create a patients.json file inside the data directory with the following structure:

    ```bash
        []
    ```

5. Start the server:

    ```bash
        node server.js
    ```

6. Open your browser and go to ```http://localhost:3000```.

## Usage

### Login

- **Doctor**: username = `doctor`, password = `password`
- **Receptionist**: username = `receptionist`, password = `password`

### Functionality

- The **receptionist** can log in and access the "Add Patient" page to add new patient details such as name, age, and gender.
- The **doctor** can log in and view/manage patient records from the "Manage Records" page.
- Patient data is stored in the `data/patients.json` file in JSON format.

## Future Enhancements

- **Data Security**: Implement more secure authentication mechanisms, such as hashed passwords.
- **Database Support**: Migrate from JSON file storage to a database such as MongoDB or PostgreSQL for better scalability and performance.
- **Appointment Scheduling**: Add a feature for managing patient appointments.
- **Medical History**: Allow the doctor to add and view a detailed medical history for each patient, with date-specific records.
- **Error Handling**: Add validation for inputs and proper error handling to improve the user experience.
