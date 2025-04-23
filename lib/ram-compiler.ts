type RAMCompilerOptions = {
    cmf: (memory: number[]) => void
    error: (idx: number, content: string) => void
    show: (content: string) => void
  }
  
  export class RAMCompiler {
    code: string[]
    memory: number[]
    labels: Record<string, number>
    finish_flg: boolean
    error_flg: boolean
    cmf: (memory: number[]) => void
    error: (idx: number, content: string) => void
    show: (content: string) => void
    code_step: number
  
    constructor(code: string, { cmf, error, show }: RAMCompilerOptions) {
      this.code = code.split("\n")
      this.memory = []
      this.labels = {}
      this.finish_flg = false
      this.error_flg = false
  
      this.cmf = cmf
      this.error = (idx, content) => {
        error(idx + 1, content)
        this.error_flg = true
        throw new Error(`Error at line ${idx + 1}: ${content}`)
      }
      this.show = show
      this.code_step = 0
  
      // Parse code and record labels
      for (let i = 0; i < this.code.length; i++) {
        let code_one = this.code[i]
        // Remove \r\n and leading whitespace
        code_one = code_one.replace(/\r/, "")
        code_one = code_one.replace(/^\s+/, "")
        code_one = code_one.replace(/;.*/, "")
  
        // Check if line contains a label
        const idx = code_one.indexOf(":")
        if (idx !== -1) {
          const [label, ...command] = code_one.split(":")
          // Check if label is valid
          if (label.indexOf(" ") !== -1 || label.indexOf("\t") !== -1) {
            this.error(i, `Label ${label} is invalid`)
          }
          this.labels[label] = i
  
          code_one = command.join(" ")
        }
        this.code[i] = code_one
      }
  
      this.show("RAM compiler is ready")
    }
  
    memorySET(idx: number, value: number) {
      this.memory[idx] = value
      this.cmf(this.memory)
    }
  
    memoryGET(idx: number) {
      // Check if memory at idx is undefined
      const value = this.memory[idx]
      if (value === undefined) {
        this.error(this.code_step, `Memory ${idx} is not defined`)
      }
      return value
    }
  
    analyzeOperand(operand: string): number {
      // Operand types:
      // num: direct addressing
      // *num: indirect addressing
      // =num: immediate value
      const type = operand[0]
      switch (type) {
        case "*":
          // Remove first character and process recursively
          return this.analyzeOperand(this.memoryGET(Number.parseInt(operand.slice(1))).toString())
        case "=":
          return Number.parseInt(operand.slice(1))
        default:
          return this.memoryGET(Number.parseInt(operand))
      }
    }
  
    analyzeOperandAddress(operand: string): number {
      // Operand types:
      // num: direct addressing
      // *num: indirect addressing
      // =num: immediate value (invalid for address)
      const type = operand[0]
      switch (type) {
        case "*":
          // Remove first character and process recursively
          return this.analyzeOperandAddress(this.memoryGET(Number.parseInt(operand.slice(1))).toString())
        case "=":
          // Error for immediate value as address
          this.error(this.code_step, "Invalid address")
          return 0
        default:
          return Number.parseInt(operand)
      }
    }
  
    interactive() {
      if (this.finish_flg) {
        this.error(this.code_step, "Code is already finished")
        return
      }
  
      // Check if code_step is out of bounds
      if (this.code_step >= this.code.length) {
        this.error(this.code_step, "EOF is reached. Did you forget to execute HALT?")
        return
      }
  
      let code_one = this.code[this.code_step]
      code_one = code_one.replace(/^\s+/, "")
  
      // Remove comments
      code_one = code_one.replace(/;.*/, "")
  
      // Remove trailing whitespace
      code_one = code_one.replace(/\s+$/, "")
  
      let [command, ...args] = code_one.split(" ")
      args = args.join("").split(",")
  
      switch (command) {
        case "LOAD":
          // Load value into r0
          if (args.length !== 1) {
            this.error(this.code_step, "LOAD command requires 1 argument (e.g. LOAD 0)")
          }
          this.memorySET(0, this.analyzeOperand(args[0]))
          this.code_step++
          break
  
        case "STORE":
          // Store r0 value to address
          if (args.length !== 1) {
            this.error(this.code_step, "STORE command requires 1 argument (e.g. STORE 1)")
          }
          this.memorySET(this.analyzeOperandAddress(args[0]), this.memoryGET(0))
          this.code_step++
          break
  
        case "ADD":
          // Add value to r0
          if (args.length !== 1) {
            this.error(this.code_step, "ADD command requires 1 argument (e.g. ADD 1)")
          }
          this.memorySET(0, this.memoryGET(0) + this.analyzeOperand(args[0]))
          this.code_step++
          break
  
        case "SUB":
          // Subtract value from r0
          if (args.length !== 1) {
            this.error(this.code_step, "SUB command requires 1 argument (e.g. SUB 1)")
          }
          this.memorySET(0, this.memoryGET(0) - this.analyzeOperand(args[0]))
          this.code_step++
          break
  
        case "MULT":
          // Multiply r0 by value
          if (args.length !== 1) {
            this.error(this.code_step, "MULT command requires 1 argument (e.g. MULT 1)")
          }
          this.memorySET(0, this.memoryGET(0) * this.analyzeOperand(args[0]))
          this.code_step++
          break
  
        case "DIV":
          // Divide r0 by value
          if (args.length !== 1) {
            this.error(this.code_step, "DIV command requires 1 argument (e.g. DIV 1)")
          }
          // Integer division
          this.memorySET(0, Math.floor(this.memoryGET(0) / this.analyzeOperand(args[0])))
          this.code_step++
          break
  
        case "JUMP":
          // Jump to label
          if (args.length !== 1) {
            this.error(this.code_step, "JUMP command requires 1 argument (e.g. JUMP label)")
          }
          // Check if label exists
          if (this.labels[args[0]] === undefined) {
            this.error(this.code_step, `Label ${args[0]} is not found`)
          }
          this.code_step = this.labels[args[0]]
          break
  
        case "JZERO":
          // Jump to label if r0 is 0
          if (args.length !== 1) {
            this.error(this.code_step, "JZERO command requires 1 argument (e.g. JZERO label)")
          }
          if (this.memoryGET(0) === 0) {
            // Check if label exists
            if (this.labels[args[0]] === undefined) {
              this.error(this.code_step, `Label ${args[0]} is not found`)
            }
            this.code_step = this.labels[args[0]]
          } else {
            this.code_step++
          }
          break
  
        case "JGTZ":
          // Jump to label if r0 > 0
          if (args.length !== 1) {
            this.error(this.code_step, "JGTZ command requires 1 argument (e.g. JGTZ label)")
          }
          if (this.memoryGET(0) > 0) {
            // Check if label exists
            if (this.labels[args[0]] === undefined) {
              this.error(this.code_step, `Label ${args[0]} is not found`)
            }
            this.code_step = this.labels[args[0]]
          } else {
            this.code_step++
          }
          break
  
        case "SJ":
          // Subtract and jump if zero
          if (args.length !== 3) {
            this.error(this.code_step, "SJ command requires 3 arguments (e.g. SJ X,Y,Z)")
          }
  
          const [X, Y, Z] = args
          // If X and Y are the same, set X to 0
          if (X === Y) {
            this.memorySET(this.analyzeOperandAddress(X), 0)
          } else {
            this.memorySET(this.analyzeOperandAddress(X), this.analyzeOperand(X) - this.analyzeOperand(Y))
          }
  
          if (this.memoryGET(this.analyzeOperandAddress(X)) === 0) {
            // Check if label exists
            if (this.labels[Z] === undefined) {
              this.error(this.code_step, `Label ${Z} is not found`)
            }
            this.code_step = this.labels[Z]
          } else {
            this.code_step++
          }
          break
  
        case "READ":
          // Read input to memory
          if (args.length !== 1) {
            this.error(this.code_step, "READ command requires 1 argument (e.g. READ 1)")
          }
  
          // In a browser environment, use prompt
          const input = prompt("Input number")
          if (input === null) {
            this.error(this.code_step, "Input cancelled")
            return
          }
  
          const parsedInput = Number.parseInt(input)
          if (isNaN(parsedInput)) {
            this.error(this.code_step, "Invalid input, expected a number")
            return
          }
  
          this.memorySET(this.analyzeOperandAddress(args[0]), parsedInput)
          this.code_step++
          break
  
        case "WRITE":
          // Write memory to output
          if (args.length !== 1) {
            this.error(this.code_step, "WRITE command requires 1 argument (e.g. WRITE 0)")
          }
          this.show(this.analyzeOperand(args[0]).toString())
          this.code_step++
          break
  
        case "HALT":
          // Stop execution
          this.finish_flg = true
          this.show("Run successfully")
          this.show("--------------------")
          return
  
        default:
          if (command === "") {
            this.code_step++
            return
          } else {
            this.error(this.code_step, `Command ${command} is not found`)
          }
      }
    }
  
    run() {
      while (!this.finish_flg && !this.error_flg) {
        this.interactive()
      }
    }
  }
  