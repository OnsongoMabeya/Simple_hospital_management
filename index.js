const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const fsExtra = require('fs-extra');
const fs = require('fs');
const hbs = require('hbs');
const path = require('path');

const app = express();

// Middleware
app.use(bodyParser.urlencoded({ extended:true }));

// Session setup
app.use(session({
    secret: 'secret-key',
    resave: false,  // If necessary, try changing this to true
    saveUninitialized: true, // Should be set to false to avoid creating sessions for unauthenticated users
    cookie: {
        maxAge: 1000 * 60 * 60 * 24, // 24 hours, adjust as needed
        secure: false, // Set to true in production when using HTTPS
        httpOnly: true, // Protects against client-side JS reading the cookie
    }
}));

// Middleware to make session user available to all views
app.use((req, res, next) => {
    console.log('Session at middleware:', req.session);

    res.locals.user = req.session.user || null;
    next();
});

// Register the 'json' helper to convert objects to JSON strings
hbs.registerHelper('json', function(context) {
    return JSON.stringify(context);
});

// Set the view engine to hbs
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));

// Roles
const users = {
    doctor: { username: 'doctor', password: 'password' },
    receptionist: { username: 'receptionist', password: 'password' }
};

// Simple Authentication
app.get('/', (req, res) => {
    res.render('login');
});

app.post('/', (req, res) => {
    const { username, password } = req.body;
    const user = users[username.toLowerCase()];

    if (user && user.password === password) {
        req.session.user = username;

        if (username === 'doctor') {
            res.redirect('/manage-records');
        }
        else {
            res.redirect('/add-patient');
        }
    }
    else {
        res.status(401).send('Invalid username or password');
    }
});

// Protect routes based on role
function ensureAuthenticated(role) {
    return (req, res, next) => {
        if (req.session.user === role) {
            next();
        }
        else {
            res.redirect('/');
        }
    };
}

// Receptionist page - Add patient details
app.get('/add-patient', ensureAuthenticated('receptionist'), (req, res) => {
    const patientsPath = path.join(__dirname, 'data', 'patients.json');

    // Read the current patients from the JSON file
    fs.readFile(patientsPath, (err, data) => {
        if (err) {
            console.error('Error reading patient data:', err);
            return res.status(500).send('Internal Server Error'); // Handle read error
        }

        const patients = JSON.parse(data); // Parse patient data

        // Filter out the medical records so only basic patient info is passed to the view
        const patientsWithoutMedicalRecords = patients.map(patient => ({
            id: patient.id,
            name: patient.name,
            age: patient.age,
            gender: patient.gender
        }));

        // Render the addPatient view and pass the filtered patient list
        res.render('addPatient', { patients: patientsWithoutMedicalRecords });
    });
});

app.post('/add-patient', (req, res) => {
    const newPatient = {
        id: Date.now(), // Assign a unique ID using the current timestamp
        name: req.body.name,
        age: req.body.age,
        gender: req.body.gender,
        medicalRecords: [] // Initialize an empty array for medical records
    };
    
    const patientsPath = path.join(__dirname, 'data', 'patients.json');

    fs.readFile(patientsPath, (err, data) => {
        if (err) {
            console.error('Error reading patient data:', err);
            return res.status(500).send('Internal Server Error'); // Handle read error
        }

        console.log('Session data:', req.session);

        // const patients = JSON.parse(data); // Parses existing patients
        let patients;
        try {
            patients = JSON.parse(data);
        } catch (parseError) {
            console.error('Error parsing patient data:', parseError);
            return res.status(500).send('Internal Server Error');
        }

        patients.push(newPatient); // Adds the new patient

        fs.writeFile(patientsPath, JSON.stringify(patients, null, 2), (err) => {
        // fsExtra.outputFile(patientsPath, JSON.stringify(patients, null, 2), (err) => {    
            if (err) {
                console.error('Error saving patient data:', err);
                return res.status(500).send('Internal Server Error'); // Error handling
            };

            console.log('New patient added:', newPatient);

            console.log('Session data:', req.session);

            // Touch the session to extend its expiration
            req.session.user = req.session.user || 'receptionist'; // Ensure user remains in session
            req.session.touch();

            // Redirect back to the 'add-patient' page or show success message
            res.redirect('/add-patient');
        });
    });
});

// Doctor page - Manage patient records
app.get('/manage-records', ensureAuthenticated('doctor'), (req, res) => {
    const patientsPath = path.join(__dirname, 'data', 'patients.json');

    fs.readFile(patientsPath, (err, data) => {
        if (err) {
            console.error('Error reading patient data:', err);
            return res.status(500).send('Internal Server Error');
        }

        const patients = JSON.parse(data);

        res.render('manageRecords', { patients });  // Pass patients to the view
    });
});

// Doctor page - Add medical record (symptoms, diagnosis, treatment)
app.post('/add-medical-record/:id', ensureAuthenticated('doctor'), (req, res) => {
    const patientId = parseInt(req.params.id); // Get patient ID from the route parameter

    console.log('Session data before saving medical record:', req.session);

    const newRecord = {
        date: new Date().toISOString().split('T')[0], // Automatically set today's date
        diagnosis: req.body.diagnosis,
        treatment: req.body.treatment
    };

    const patientsPath = path.join(__dirname, 'data', 'patients.json');

    fs.readFile(patientsPath, (err, data) => {
        if (err) {
            console.error('Error reading patient data:', err);
            return res.status(500).send('Internal Server Error');
        }
        
        // handling of patients data
        let patients;
        try {
            patients = JSON.parse(data);
        } catch (parseError) {
            console.error('Error parsing patient data:', parseError);
            return res.status(500).send('Internal Server Error');
        }

        const patient = patients.find(p => p.id === patientId);
        if (patient) {
            patient.medicalRecords.push(newRecord); // Add new record to the patient's medical history

            // Logging new Patients data
            console.log(patients);

            fs.writeFile(patientsPath, JSON.stringify(patients, null, 2), (err) => {    
                if (err) {
                    console.error('Error saving patient data:', err);
                    return res.status(500).send('Internal Server Error');
                }

                // Touch the session to extend its expiration
                req.session.user = req.session.user || 'doctor'; // Ensure user remains in session
                req.session.touch();

                res.redirect('/manage-records'); // After adding, redirect back to manage records page
            });
        }
        else (
            console.log('Patient not found')
        )

        console.log('Session data after saving medical record:', req.session);
    });
});

app.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(400).send({ message: 'Error logging out' });
        }

        res.redirect('/');
    });
});

app.listen(3000, () => {
    console.log('Server is running on http://localhost:3000');
});