const express = require('express');
const fileName = 'db.txt';
const fs = require('fs');
const app = express();
const PORT = 3002;

app.use(express.json());

if (!fs.existsSync(fileName)) {
    fs.writeFileSync(fileName, '');
}

app.post('/data', (req, res) => {
    const { email, token } = req.body;
    if (!email || !token) {
        return res.status(400).json({ error: 'Both Email and Token are required' });
    }

    fs.appendFile(fileName, `${email},${token}\n`, (err) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to add record' });
        }
        res.status(201).json({ message: 'Record added successfully' });
    });
});

app.get('/get_token', (req, res) => {
    const email = req.query.email; 
    if (!email) {
        return res.status(400).json({ error: 'Email is required' });
    }

    fs.readFile(fileName, 'utf8', (err, data) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to read data' });
        }

        const lines = data.split('\n');
        for (const line of lines) {
            if (line) {
                const [storedEmail, storedToken] = line.split(',');
                if (storedEmail === email) {
                    return res.status(200).json({ token: storedToken.trim() });
                }
            }
        }

        res.status(404).json({ error: 'Email not found' });
    });
});


app.post('/delete', (req, res) => {
    const { email, token } = req.body;
    if (!email || !token) {
        return res.status(400).json({ error: 'Both Email and Token are required' });
    }

    fs.readFile(fileName, 'utf8', (err, data) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to read data' });
        }

        const lines = data.split('\n');
        const updatedRecords = [];
        let recordDeleted = false;

        for (const line of lines) {
            if (line) {
                const [storedEmail, storedToken] = line.split(',');
                if (storedEmail === email && storedToken === token) {
                    recordDeleted = true; 
                } else {
                    updatedRecords.push(line);
                }
            }
        }

        if (!recordDeleted) {
            return res.status(400).json({ error: 'Email and Token do not match' });
        }

        fs.writeFile(fileName, updatedRecords.join('\n'), (err) => {
            if (err) {
                return res.status(500).json({ error: 'Failed to delete record' });
            }
            res.status(200).json({ message: 'Record deleted successfully' });
        });
    });
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
