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
  
      for (let i = 0; i < this.code.length; i++) {
        let code_one = this.code[i]
        code_one = code_one.replace(/\r/, "")
        code_one = code_one.replace(/^\s+/, "")
        code_one = code_one.replace(/;.*/, "")
  
        const idx = code_one.indexOf(":")
        if (idx !== -1) {
          const [label, ...command] = code_one.split(":")
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
      const value = this.memory[idx]
      if (value === undefined) {
        this.error(this.code_step, `Memory ${idx} is not defined`)
      }
      return value
    }
  
    analyzeOperand(operand: string): number {
      const type = operand[0]
      switch (type) {
        case "*":
          return this.analyzeOperand(this.memoryGET(Number.parseInt(operand.slice(1))).toString())
        case "=":
          return Number.parseInt(operand.slice(1))
        default:
          return this.memoryGET(Number.parseInt(operand))
      }
    }
  
    analyzeOperandAddress(operand: string): number {
      const type = operand[0]
      switch (type) {
        case "*":
          return this.analyzeOperandAddress(this.memoryGET(Number.parseInt(operand.slice(1))).toString())
        case "=":
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
      if (this.code_step >= this.code.length) {
        this.error(this.code_step, "EOF is reached. Did you forget to execute HALT?")
        return
      }
  
      let code_one = this.code[this.code_step]
      code_one = code_one.replace(/^\s+/, "")
      code_one = code_one.replace(/;.*/, "")
      code_one = code_one.replace(/\s+$/, "")
  
      let [command, ...args] = code_one.split(" ")
      args = args.join("").split(",")
  
      switch (command) {
        case "LOAD":
          if (args.length !== 1) {
            this.error(this.code_step, "LOAD command requires 1 argument (e.g. LOAD 0)")
          }
          this.memorySET(0, this.analyzeOperand(args[0]))
          this.code_step++
          break
  
        case "STORE":
          if (args.length !== 1) {
            this.error(this.code_step, "STORE command requires 1 argument (e.g. STORE 1)")
          }
          this.memorySET(this.analyzeOperandAddress(args[0]), this.memoryGET(0))
          this.code_step++
          break
  
        case "ADD":
          if (args.length !== 1) {
            this.error(this.code_step, "ADD command requires 1 argument (e.g. ADD 1)")
          }
          this.memorySET(0, this.memoryGET(0) + this.analyzeOperand(args[0]))
          this.code_step++
          break
  
        case "SUB":
          if (args.length !== 1) {
            this.error(this.code_step, "SUB command requires 1 argument (e.g. SUB 1)")
          }
          this.memorySET(0, this.memoryGET(0) - this.analyzeOperand(args[0]))
          this.code_step++
          break
  
        case "MULT":
          if (args.length !== 1) {
            this.error(this.code_step, "MULT command requires 1 argument (e.g. MULT 1)")
          }
          this.memorySET(0, this.memoryGET(0) * this.analyzeOperand(args[0]))
          this.code_step++
          break
  
        case "DIV":
          if (args.length !== 1) {
            this.error(this.code_step, "DIV command requires 1 argument (e.g. DIV 1)")
          }
          this.memorySET(0, Math.floor(this.memoryGET(0) / this.analyzeOperand(args[0])))
          this.code_step++
          break
  
        case "JUMP":
          if (args.length !== 1) {
            this.error(this.code_step, "JUMP command requires 1 argument (e.g. JUMP label)")
          }
          if (this.labels[args[0]] === undefined) {
            this.error(this.code_step, `Label ${args[0]} is not found`)
          }
          this.code_step = this.labels[args[0]]
          break
  
        case "JZERO":
          if (args.length !== 1) {
            this.error(this.code_step, "JZERO command requires 1 argument (e.g. JZERO label)")
          }
          if (this.memoryGET(0) === 0) {
            if (this.labels[args[0]] === undefined) {
              this.error(this.code_step, `Label ${args[0]} is not found`)
            }
            this.code_step = this.labels[args[0]]
          } else {
            this.code_step++
          }
          break
  
        case "JGTZ":
          if (args.length !== 1) {
            this.error(this.code_step, "JGTZ command requires 1 argument (e.g. JGTZ label)")
          }
          if (this.memoryGET(0) > 0) {
            if (this.labels[args[0]] === undefined) {
              this.error(this.code_step, `Label ${args[0]} is not found`)
            }
            this.code_step = this.labels[args[0]]
          } else {
            this.code_step++
          }
          break
  
        case "SJ":
          if (args.length !== 3) {
            this.error(this.code_step, "SJ command requires 3 arguments (e.g. SJ X,Y,Z)")
          }
  
          const [X, Y, Z] = args
          if (X === Y) {
            this.memorySET(this.analyzeOperandAddress(X), 0)
          } else {
            this.memorySET(this.analyzeOperandAddress(X), this.analyzeOperand(X) - this.analyzeOperand(Y))
          }
  
          if (this.memoryGET(this.analyzeOperandAddress(X)) === 0) {
            if (this.labels[Z] === undefined) {
              this.error(this.code_step, `Label ${Z} is not found`)
            }
            this.code_step = this.labels[Z]
          } else {
            this.code_step++
          }
          break
  
        case "READ":
          if (args.length !== 1) {
            this.error(this.code_step, "READ command requires 1 argument (e.g. READ 1)")
          }
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
  