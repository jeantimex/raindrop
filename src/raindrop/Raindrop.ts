export interface TrailDrop {
  x: number
  y: number
  size: number
  opacity: number
}

export class Raindrop {
  x: number
  y: number
  size: number
  velocity: number = 0
  momentum: number = 0

  trail: TrailDrop[] = []
  lastTrailTime: number = 0

  isMoving: boolean = false
  stuckTime: number = 0
  stuckThreshold: number

  killed: boolean = false

  constructor(x: number, y: number, size: number) {
    this.x = x
    this.y = y
    this.size = size
    this.stuckThreshold = 0.5 + Math.random() * 2
  }

  update(deltaTime: number, time: number, canvasHeight: number): boolean {
    const gravity = 0.5
    const friction = 0.98
    const minVelocity = 0.01

    // Larger drops are heavier and more likely to move
    const weight = this.size * this.size * 0.001

    if (!this.isMoving) {
      this.stuckTime += deltaTime
      // Chance to start moving based on size and stuck time
      if (this.stuckTime > this.stuckThreshold && Math.random() < weight * 0.1) {
        this.isMoving = true
        this.velocity = 0.1
      }
    }

    if (this.isMoving) {
      // Apply gravity based on drop mass
      this.velocity += gravity * weight * deltaTime
      this.velocity *= friction

      // Add some horizontal wobble
      this.momentum += (Math.random() - 0.5) * 0.02
      this.momentum *= 0.95

      this.x += this.momentum
      this.y += this.velocity

      // Leave trail drops
      if (time - this.lastTrailTime > 0.02 && this.velocity > 0.5) {
        this.trail.push({
          x: this.x + (Math.random() - 0.5) * this.size * 0.3,
          y: this.y - this.size * 0.5,
          size: this.size * (0.1 + Math.random() * 0.15),
          opacity: 1
        })
        this.lastTrailTime = time

        // Shrink main drop slightly as it leaves trail
        this.size *= 0.998
      }

      // Random chance to stop
      if (Math.random() < 0.002) {
        this.isMoving = false
        this.stuckTime = 0
        this.velocity = 0
        this.stuckThreshold = 1 + Math.random() * 3
      }

      // Stop if too slow
      if (this.velocity < minVelocity) {
        this.isMoving = false
        this.stuckTime = 0
        this.velocity = 0
      }
    }

    // Fade trail drops
    for (let i = this.trail.length - 1; i >= 0; i--) {
      this.trail[i].opacity -= deltaTime * 0.3
      if (this.trail[i].opacity <= 0) {
        this.trail.splice(i, 1)
      }
    }

    // Check if drop is off screen
    if (this.y > canvasHeight + this.size || this.size < 1) {
      this.killed = true
      return false
    }

    return true
  }

  collidesWith(other: Raindrop): boolean {
    const dx = this.x - other.x
    const dy = this.y - other.y
    const dist = Math.sqrt(dx * dx + dy * dy)
    return dist < (this.size + other.size) * 0.5
  }

  absorb(other: Raindrop) {
    // Combine masses (areas)
    const totalArea = Math.PI * this.size * this.size + Math.PI * other.size * other.size
    this.size = Math.sqrt(totalArea / Math.PI)

    // Average position weighted by size
    const totalSize = this.size + other.size
    this.x = (this.x * this.size + other.x * other.size) / totalSize
    this.y = Math.max(this.y, other.y)

    // Combine velocities
    this.velocity = Math.max(this.velocity, other.velocity) * 1.1
    this.momentum += other.momentum * 0.5

    // Absorbing triggers movement
    if (this.size > 15) {
      this.isMoving = true
    }

    other.killed = true
  }
}
