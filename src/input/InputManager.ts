export class InputManager {
  private keys: Set<string> = new Set()
  private mousePosition: { x: number; y: number } = { x: 0, y: 0 }
  private mouseDelta: { x: number; y: number } = { x: 0, y: 0 }
  private mouseButtons: Set<number> = new Set()
  private isPointerLocked = false

  constructor(canvas: HTMLCanvasElement) {
    this.setupKeyboardListeners()
    this.setupMouseListeners(canvas)
  }

  private setupKeyboardListeners() {
    window.addEventListener('keydown', (e) => {
      this.keys.add(e.code)
    })

    window.addEventListener('keyup', (e) => {
      this.keys.delete(e.code)
    })
  }

  private setupMouseListeners(canvas: HTMLCanvasElement) {
    canvas.addEventListener('mousedown', (e) => {
      this.mouseButtons.add(e.button)
    })

    canvas.addEventListener('mouseup', (e) => {
      this.mouseButtons.delete(e.button)
    })

    canvas.addEventListener('mousemove', (e) => {
      if (this.isPointerLocked) {
        this.mouseDelta.x = e.movementX
        this.mouseDelta.y = e.movementY
      } else {
        this.mouseDelta.x = e.clientX - this.mousePosition.x
        this.mouseDelta.y = e.clientY - this.mousePosition.y
      }
      this.mousePosition.x = e.clientX
      this.mousePosition.y = e.clientY
    })

    canvas.addEventListener('click', () => {
      if (!this.isPointerLocked) {
        canvas.requestPointerLock()
      }
    })

    document.addEventListener('pointerlockchange', () => {
      this.isPointerLocked = document.pointerLockElement === canvas
    })
  }

  isKeyDown(code: string): boolean {
    return this.keys.has(code)
  }

  isMouseButtonDown(button: number): boolean {
    return this.mouseButtons.has(button)
  }

  getMousePosition(): { x: number; y: number } {
    return { ...this.mousePosition }
  }

  getMouseDelta(): { x: number; y: number } {
    const delta = { ...this.mouseDelta }
    this.mouseDelta.x = 0
    this.mouseDelta.y = 0
    return delta
  }

  isPointerLockedState(): boolean {
    return this.isPointerLocked
  }
}
