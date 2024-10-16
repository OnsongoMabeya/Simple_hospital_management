const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const hbs = require('hbs');

const app = express();

// Middleware
app.use(bodyParser.urlencoded({ extended:true }));

// Session setup
app.use(session({
    secret: 'secret-key',
    resave: false,
    saveUninitialized: true
}));

// Middleware to make session user available to all views
app.use((req, res, next) => {
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
            res.sendStatus(403); // Forbidden

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
    // Add patient logic here
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

        const patients = JSON.parse(data); // Parses existing patients

        patients.push(newPatient); // Adds the new patient

        fs.writeFile(patientsPath, JSON.stringify(patients, null, 2), (err) => {
            if (err) {
                console.error('Error saving patient data:', err);
                return res.status(500).send('Internal Server Error'); // Error handling
            };
            // res.send('Patient added successfully!');

            console.log('New patient added:', newPatient);
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
        // console.log(patients);

        res.render('manageRecords', { patients });  // Pass patients to the view
    });
});

// Doctor page - Add medical record (symptoms, diagnosis, treatment)
app.post('/add-medical-record/:id', ensureAuthenticated('doctor'), (req, res) => {
    const patientId = parseInt(req.params.id); // Get patient ID from the route parameter

    const newRecord = {
        date: new Date().toISOString().split('T')[0], // Automatically set today's date
        diagnosis: req.body.diagnosis,
        treatment: req.body.treatment
    };

    const patientsPath = path.join(__dirname, 'data', 'patients.json');

    fs.readFile(patientsPath, (err, data) => {
        if (err) throw err;
        const patients = JSON.parse(data);

        const patient = patients.find(p => p.id === patientId);
        if (patient) {
            patient.medicalRecords.push(newRecord); // Add new record to the patient's medical history
        }

        fs.writeFile(patientsPath, JSON.stringify(patients, null, 2), (err) => {
            if (err) throw err;

            res.redirect('/manage-records'); // After adding, redirect back to manage records page
        });
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