"use client"

import { useState, useRef, useEffect } from "react"
import Editor from "@monaco-editor/react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RAMCompiler } from "@/lib/ram-compiler"
import { Play, Pause, RotateCcw, StepForward } from "lucide-react"
import { Slider } from "@/components/ui/slider"

export default function Home() {
  const [code, setCode] = useState(`; Example RAM program to calculate factorial
; Input: n
; Output: n!

READ 1       ; Read input into r1
LOAD 1       ; Load r1 into r0
JZERO done   ; If input is 0, jump to done
STORE 2      ; Store r0 into r2 (result)
LOAD =1      ; Load 1 into r0
STORE 3      ; Store r0 into r3 (counter)

loop:
LOAD 3       ; Load counter into r0
ADD =1       ; Increment counter
STORE 3      ; Store incremented counter
LOAD 3       ; Load counter into r0
SUB 1        ; Subtract input from counter
JGTZ done    ; If counter > input, jump to done
LOAD 2       ; Load result into r0
MULT 3       ; Multiply result by counter
STORE 2      ; Store product into result
JUMP loop    ; Repeat

done:
LOAD 2       ; Load result into r0
WRITE 0      ; Output result
HALT         ; Stop execution
`)
  const [memory, setMemory] = useState<number[]>([])
  const [showMemory, setShowMemory] = useState(true)
  const [consoleOutput, setConsoleOutput] = useState<string[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const [speed, setSpeed] = useState(100)
  const [currentLine, setCurrentLine] = useState(-1)
  const ramRef = useRef<RAMCompiler | null>(null)
  const editorRef = useRef<any>(null)
  const decorationsRef = useRef<any>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const handleEditorDidMount = (editor: any) => {
    editorRef.current = editor
  }

  const clearConsole = () => {
    setConsoleOutput([])
  }

  const initializeRAM = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }

    setIsRunning(false)
    setCurrentLine(-1)
    clearConsole()

    try {
      ramRef.current = new RAMCompiler(code, {
        cmf: (memory) => {
          setMemory([...memory])
        },
        error: (idx, content) => {
          setConsoleOutput((prev) => [...prev, `Error at line ${idx}: ${content}`])
        },
        show: (content) => {
          setConsoleOutput((prev) => [...prev, content])
        },
      })
      addConsoleMessage("RAM compiler is ready")
    } catch (error) {
      addConsoleMessage(`Initialization error: ${error}`)
    }
  }

  const addConsoleMessage = (message: string) => {
    setConsoleOutput((prev) => [...prev, message])
  }

  const runRAM = () => {
    if (!ramRef.current) {
      addConsoleMessage("Please initialize RAM first")
      return
    }

    setIsRunning(true)

    if (speed === 0) {
      try {
        ramRef.current.run()
        setIsRunning(false)
        updateEditorLine()
      } catch (error) {
        addConsoleMessage(`Runtime error: ${error}`)
        setIsRunning(false)
      }
    } else {
      runStep()
      intervalRef.current = setInterval(runStep, Math.max(10, 1000 - speed * 10))
    }
  }

  const stopRAM = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    setIsRunning(false)
  }

  const runStep = () => {
    if (!ramRef.current) {
      addConsoleMessage("Please initialize RAM first")
      return
    }

    try {
      if (!ramRef.current.finish_flg && !ramRef.current.error_flg) {
        setCurrentLine(ramRef.current.code_step)
        ramRef.current.interactive()
        updateEditorLine()
      } else {
        stopRAM()
      }
    } catch (error) {
      addConsoleMessage(`Runtime error: ${error}`)
      stopRAM()
    }
  }

  const updateEditorLine = () => {
    if (!editorRef.current || !ramRef.current) return

    if (decorationsRef.current) {
      decorationsRef.current.clear()
    }

    if (ramRef.current.code_step >= 0 && !ramRef.current.finish_flg) {
      decorationsRef.current = editorRef.current.createDecorationsCollection([
        {
          range: {
            startLineNumber: ramRef.current.code_step + 1,
            startColumn: 1,
            endLineNumber: ramRef.current.code_step + 1,
            endColumn: 1,
          },
          options: {
            isWholeLine: true,
            className: "current-line-highlight",
            glyphMarginClassName: "current-line-glyph",
          },
        },
      ])
    }
  }

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])

  useEffect(() => {
    if (currentLine >= 0) {
      updateEditorLine()
    }
  }, [currentLine])

  return (
    <main className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">RAM Compiler</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <Card className="p-4">
            <div className="mb-4">
              <h2 className="text-xl font-semibold mb-2">Code Editor</h2>
              <div className="h-[500px] border rounded-md overflow-hidden">
                <Editor
                  height="100%"
                  defaultLanguage="plaintext"
                  value={code}
                  onChange={(value) => setCode(value || "")}
                  onMount={handleEditorDidMount}
                  options={{
                    minimap: { enabled: false },
                    lineNumbers: "on",
                    glyphMargin: true,
                    scrollBeyondLastLine: false,
                  }}
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button onClick={initializeRAM} variant="outline">
                <RotateCcw className="mr-2 h-4 w-4" />
                Initialize
              </Button>
              <Button onClick={runRAM} disabled={isRunning || !ramRef.current} variant="default">
                <Play className="mr-2 h-4 w-4" />
                Run
              </Button>
              <Button onClick={stopRAM} disabled={!isRunning} variant="destructive">
                <Pause className="mr-2 h-4 w-4" />
                Stop
              </Button>
              <Button
                onClick={runStep}
                disabled={
                  isRunning ||
                  !ramRef.current ||
                  (ramRef.current && (ramRef.current.finish_flg || ramRef.current.error_flg))
                }
                variant="outline"
              >
                <StepForward className="mr-2 h-4 w-4" />
                Step
              </Button>

              <div className="flex items-center ml-4 gap-2">
                <span className="text-sm">Speed:</span>
                <Slider
                  value={[speed]}
                  min={0}
                  max={100}
                  step={1}
                  className="w-32"
                  onValueChange={(value) => setSpeed(value[0])}
                />
                <span className="text-xs text-muted-foreground w-8">{speed === 0 ? "Max" : speed}</span>
              </div>
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="p-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xl font-semibold">Memory</h2>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="show-memory"
                  checked={showMemory}
                  onCheckedChange={(checked) => setShowMemory(checked as boolean)}
                />
                <label htmlFor="show-memory" className="text-sm">
                  Show Memory
                </label>
              </div>
            </div>

            {showMemory && (
              <div className="max-h-[200px] overflow-y-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Register</th>
                      <th className="text-left p-2">Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {memory.map((value, index) => (
                      <tr key={index} className="border-b">
                        <td className="p-2">r{index}</td>
                        <td className="p-2">{value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xl font-semibold">Console</h2>
              <Button onClick={clearConsole} variant="outline" size="sm">
                Clear
              </Button>
            </div>
            <div className="bg-black text-green-400 p-2 rounded-md h-[300px] overflow-y-auto font-mono text-sm">
              {consoleOutput.map((line, index) => {
                const isError = line.startsWith("Error")
                return (
                  <div key={index} className={`${isError ? "text-red-400" : ""}`}>
                    {line}
                  </div>
                )
              })}
            </div>
          </Card>
        </div>
      </div>

      <Card className="mt-4 p-4">
        <Tabs defaultValue="instructions">
          <TabsList>
            <TabsTrigger value="instructions">Instructions</TabsTrigger>
            <TabsTrigger value="about">About RAM</TabsTrigger>
          </TabsList>
          <TabsContent value="instructions" className="space-y-2">
            <h3 className="text-lg font-semibold">RAM Instructions</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                <code>LOAD x</code>: Copy data to r0 (e.g., <code>LOAD 1</code>)
              </li>
              <li>
                <code>STORE x</code>: Copy r0 content to another location (e.g., <code>STORE 1</code>)
              </li>
              <li>
                <code>ADD x</code>: r0 ← r0 + memory (e.g., <code>ADD =10</code>)
              </li>
              <li>
                <code>SUB x</code>: r0 ← r0 - memory (e.g., <code>SUB 1</code>)
              </li>
              <li>
                <code>MULT x</code>: r0 ← r0 × memory (e.g., <code>MULT 1</code>)
              </li>
              <li>
                <code>DIV x</code>: r0 ← r0 / memory (e.g., <code>DIV 10</code>)
              </li>
              <li>
                <code>JUMP label</code>: Jump to the given label
              </li>
              <li>
                <code>JZERO label</code>: Jump to the label if r0 = 0
              </li>
              <li>
                <code>JGTZ label</code>: Jump to the label if r0 &gt; 0
              </li>
              <li>
                <code>READ x</code>: Read from input to memory
              </li>
              <li>
                <code>WRITE x</code>: Write from memory to output
              </li>
              <li>
                <code>HALT</code>: Stop execution
              </li>
            </ul>
            <h3 className="text-lg font-semibold mt-4">Addressing Modes</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                <code>num</code>: Direct addressing (e.g., <code>LOAD 5</code> loads the value at register 5)
              </li>
              <li>
                <code>*num</code>: Indirect addressing (e.g., <code>LOAD *5</code> loads the value at the register whose
                address is stored in register 5)
              </li>
              <li>
                <code>=num</code>: Immediate addressing (e.g., <code>LOAD =5</code> loads the value 5 directly)
              </li>
            </ul>
          </TabsContent>
          <TabsContent value="about">
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">About Random Access Machine (RAM)</h3>
              <p>
                The Random Access Machine (RAM) is a theoretical computational model used in computer science to analyze
                algorithms. It consists of a finite set of registers that can store arbitrary integers and a program
                that operates on these registers.
              </p>
              <p>
                RAM is a simple but powerful model that can simulate any algorithm. It&apos;s often used in algorithm
                analysis and computational complexity theory to measure the efficiency of algorithms.
              </p>
              <p>
                This implementation allows you to write and execute RAM assembly code directly in your browser,
                visualize memory states, and debug your programs step by step.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </Card>
    </main>
  )
}
