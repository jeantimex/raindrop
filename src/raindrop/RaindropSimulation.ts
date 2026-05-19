import { Raindrop } from './Raindrop'

export interface DropData {
  x: number
  y: number
  size: number
  opacity: number
}

export class RaindropSimulation {
  private drops: Raindrop[] = []
  private width: number = 0
  private height: number = 0

  private spawnTimer: number = 0
  private spawnRate: number = 0.05 // seconds between spawns

  readonly maxDrops: number = 500
  readonly maxTrailDrops: number = 2000

  resize(width: number, height: number) {
    this.width = width
    this.height = height
  }

  update(deltaTime: number, time: number) {
    // Spawn new drops
    this.spawnTimer += deltaTime
    while (this.spawnTimer > this.spawnRate && this.drops.length < this.maxDrops) {
      this.spawnDrop()
      this.spawnTimer -= this.spawnRate
    }

    // Update existing drops
    for (const drop of this.drops) {
      drop.update(deltaTime, time, this.height)
    }

    // Check collisions and merging
    this.handleCollisions()

    // Remove dead drops
    this.drops = this.drops.filter(d => !d.killed)
  }

  private spawnDrop() {
    const x = Math.random() * this.width
    const y = Math.random() * this.height * 0.3 // Spawn in upper portion

    // Varied sizes: mostly small, some medium, few large
    let size: number
    const r = Math.random()
    if (r < 0.7) {
      size = 2 + Math.random() * 6 // Small: 2-8
    } else if (r < 0.9) {
      size = 8 + Math.random() * 15 // Medium: 8-23
    } else {
      size = 20 + Math.random() * 25 // Large: 20-45
    }

    const drop = new Raindrop(x, y, size)

    // Large drops more likely to start moving
    if (size > 20 && Math.random() < 0.3) {
      drop.isMoving = true
      drop.velocity = 0.5 + Math.random() * 1
    }

    this.drops.push(drop)
  }

  private handleCollisions() {
    for (let i = 0; i < this.drops.length; i++) {
      for (let j = i + 1; j < this.drops.length; j++) {
        const a = this.drops[i]
        const b = this.drops[j]

        if (a.killed || b.killed) continue

        if (a.collidesWith(b)) {
          // Larger drop absorbs smaller
          if (a.size >= b.size) {
            a.absorb(b)
          } else {
            b.absorb(a)
          }
        }
      }
    }
  }

  getDropData(): DropData[] {
    const data: DropData[] = []

    // Add main drops
    for (const drop of this.drops) {
      if (!drop.killed) {
        data.push({
          x: drop.x,
          y: drop.y,
          size: drop.size,
          opacity: 1
        })
      }
    }

    // Add trail drops
    for (const drop of this.drops) {
      for (const trail of drop.trail) {
        data.push({
          x: trail.x,
          y: trail.y,
          size: trail.size,
          opacity: trail.opacity
        })
      }
    }

    return data
  }

  getDropCount(): number {
    return this.drops.length
  }

  getTrailCount(): number {
    let count = 0
    for (const drop of this.drops) {
      count += drop.trail.length
    }
    return count
  }
}
