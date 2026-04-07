import { spawn } from 'child_process'
import path from 'path'
import fs from 'fs'
import { app } from 'electron'

export interface RunResult {
  passed: boolean
  output: string
  errors: string
}

export async function runPythonLab(
  userCode: string,
  validationCode: string
): Promise<RunResult> {
  const tmpDir = path.join(app.getPath('temp'), 'cortex-lab-runner')
  if (!fs.existsSync(tmpDir)) {
    fs.mkdirSync(tmpDir, { recursive: true })
  }

  // Combine user code + validation into a single script
  const fullScript = `${userCode}\n\n# --- Validation ---\n${validationCode}`
  const scriptPath = path.join(tmpDir, `lab_${Date.now()}.py`)

  fs.writeFileSync(scriptPath, fullScript, 'utf-8')

  try {
    const result = await executePython(scriptPath)
    // Clean up
    fs.unlinkSync(scriptPath)

    const passed = result.output.includes('PASS') && !result.errors
    return {
      passed,
      output: result.output,
      errors: result.errors
    }
  } catch (err) {
    // Clean up on error too
    try { fs.unlinkSync(scriptPath) } catch {}
    return {
      passed: false,
      output: '',
      errors: String(err)
    }
  }
}

function executePython(scriptPath: string): Promise<{ output: string; errors: string }> {
  return new Promise((resolve, reject) => {
    // Try python3 first, fall back to python
    const pythonCmd = process.platform === 'win32' ? 'python' : 'python3'
    const proc = spawn(pythonCmd, [scriptPath], {
      timeout: 30000,
      env: { ...process.env },
      cwd: path.dirname(scriptPath)
    })

    let stdout = ''
    let stderr = ''

    proc.stdout.on('data', (data: Buffer) => {
      stdout += data.toString()
    })

    proc.stderr.on('data', (data: Buffer) => {
      stderr += data.toString()
    })

    proc.on('close', (code: number | null) => {
      if (code === null) {
        reject(new Error('Process timed out after 30 seconds'))
      } else {
        resolve({ output: stdout.trim(), errors: stderr.trim() })
      }
    })

    proc.on('error', (err: Error) => {
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
        // python3 not found, try python
        const fallback = spawn('python', [scriptPath], {
          timeout: 30000,
          env: { ...process.env },
          cwd: path.dirname(scriptPath)
        })

        let fbOut = ''
        let fbErr = ''

        fallback.stdout.on('data', (data: Buffer) => { fbOut += data.toString() })
        fallback.stderr.on('data', (data: Buffer) => { fbErr += data.toString() })

        fallback.on('close', (code: number | null) => {
          if (code === null) {
            reject(new Error('Process timed out after 30 seconds'))
          } else {
            resolve({ output: fbOut.trim(), errors: fbErr.trim() })
          }
        })

        fallback.on('error', () => {
          reject(new Error('Python not found. Please install Python 3 and ensure it\'s in your PATH.'))
        })
      } else {
        reject(err)
      }
    })
  })
}
