import express from 'express';
import { execFile, exec } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const isProduction = process.env.NODE_ENV === 'production';

app.use(express.json());

// API endpoint to execute the structured Python hydraulic solver
app.post('/api/calculate-python', (req, res) => {
  const inputData = JSON.stringify(req.body);
  const scriptPath = path.resolve(__dirname, 'server', 'flow_calculator.py');

  const startTime = Date.now();
  execFile('python3', [scriptPath, inputData], { timeout: 8000 }, (error, stdout, stderr) => {
    const elapsedMs = Date.now() - startTime;
    if (error) {
      console.error('Python execution error:', error, stderr);
      return res.status(500).json({
        status: 'error',
        error: error.message,
        stderr: stderr || '',
        elapsedMs
      });
    }

    try {
      const parsed = JSON.parse(stdout.trim());
      return res.json({
        ...parsed,
        elapsedMs,
        rawStdout: stdout
      });
    } catch {
      return res.json({
        status: 'raw_output',
        output: stdout,
        stderr,
        elapsedMs
      });
    }
  });
});

// API endpoint to execute arbitrary verified user Python script snippets
app.post('/api/run-python-code', (req, res) => {
  const { code } = req.body;
  if (!code || typeof code !== 'string') {
    return res.status(400).json({ status: 'error', error: 'No Python code provided.' });
  }

  // Safety filter for student environment
  const disallowed = ['import os', 'subprocess', 'open(', 'eval(', 'exec(', 'shutil', 'socket', '__import__'];
  for (const token of disallowed) {
    if (code.includes(token)) {
      return res.status(400).json({
        status: 'error',
        error: `Security policy restriction: Disallowed pattern '${token}' for web sandbox.`
      });
    }
  }

  const startTime = Date.now();
  const child = exec('python3 -c ' + JSON.stringify(code), { timeout: 8000, maxBuffer: 1024 * 512 }, (error, stdout, stderr) => {
    const elapsedMs = Date.now() - startTime;
    return res.json({
      status: error ? 'error' : 'success',
      stdout: stdout || '',
      stderr: stderr || '',
      exitCode: error ? error.code || 1 : 0,
      elapsedMs
    });
  });
});

// Mount Vite middleware in development or serve static in production
async function startServer() {
  if (!isProduction) {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`HydroFlow Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
