import './style.css'
import GUI from 'lil-gui'
import { RaindropRenderer, RaindropParams } from './raindrop/RaindropRenderer'

class App {
  private renderer!: RaindropRenderer
  private lastTime = 0
  private accumulatedTime = 0
  private gui!: GUI
  private controls = {
    paused: false
  }

  private params: RaindropParams = {
    background: 'Diagon Alley',
    rainAmount: 0.8,
    dropSpeed: 0.75,
    sawProbability: 0.4,
    dropSize: 1.0,
    minBlur: 2.0,
    maxBlur: 6.0,
    refractionStrength: 1.0,
    rimLightIntensity: 0.08,
    specularIntensity: 0.15,
    specularPower: 20.0,
    lightningEnabled: true,
    lightningIntensity: 0.3,
  }

  private backgrounds: Record<string, string | null> = {
    'Neon Night': null, // procedural
    'Diagon Alley': `${import.meta.env.BASE_URL}backgrounds/diagon_alley.jpg`,
  }

  async init() {
    const canvas = document.createElement('canvas')
    canvas.id = 'webgpu-canvas'
    document.querySelector<HTMLDivElement>('#app')!.appendChild(canvas)

    this.renderer = new RaindropRenderer(canvas)
    await this.renderer.init()
    await this.renderer.setBackground(this.backgrounds[this.params.background])

    this.setupGUI()
    this.setupResizeHandler()
    this.start()
  }

  private setupGUI() {
    this.gui = new GUI()

    this.gui.add(this.controls, 'paused').name('Paused')

    const sceneFolder = this.gui.addFolder('Scene')
    sceneFolder.add(this.params, 'background', Object.keys(this.backgrounds))
      .name('Background')
      .onChange(async (value: string) => {
        const path = this.backgrounds[value]
        await this.renderer.setBackground(path)
      })

    const rainFolder = this.gui.addFolder('Rain')
    rainFolder.add(this.params, 'rainAmount', 0, 1, 0.01).name('Amount')
    rainFolder.add(this.params, 'dropSpeed', 0.1, 2, 0.05).name('Speed')
    rainFolder.add(this.params, 'sawProbability', 0, 1, 0.05).name('Stop Probability')

    const blurFolder = this.gui.addFolder('Blur')
    blurFolder.add(this.params, 'minBlur', 0, 6, 0.1).name('Min Blur')
    blurFolder.add(this.params, 'maxBlur', 0, 10, 0.1).name('Max Blur')

    const dropFolder = this.gui.addFolder('Drop Appearance')
    dropFolder.add(this.params, 'refractionStrength', 0, 2, 0.05).name('Refraction')
    dropFolder.add(this.params, 'rimLightIntensity', 0, 0.5, 0.01).name('Rim Light')
    dropFolder.add(this.params, 'specularIntensity', 0, 0.5, 0.01).name('Specular')
    dropFolder.add(this.params, 'specularPower', 5, 50, 1).name('Specular Sharpness')

    const effectsFolder = this.gui.addFolder('Effects')
    effectsFolder.add(this.params, 'lightningEnabled').name('Lightning')
    effectsFolder.add(this.params, 'lightningIntensity', 0, 1, 0.05).name('Lightning Intensity')

    this.gui.close()
  }

  private setupResizeHandler() {
    const resize = () => {
      const width = window.innerWidth
      const height = window.innerHeight
      this.renderer.resize(width, height)
    }
    window.addEventListener('resize', resize)
    resize()
  }

  private start() {
    requestAnimationFrame(this.loop.bind(this))
  }

  private loop(time: number) {
    const deltaTime = Math.min((time - this.lastTime) / 1000, 0.1)
    this.lastTime = time

    if (this.controls.paused) {
      requestAnimationFrame(this.loop.bind(this))
      return
    }

    this.accumulatedTime += deltaTime

    this.renderer.update(deltaTime, this.accumulatedTime, this.params)
    this.renderer.render()

    requestAnimationFrame(this.loop.bind(this))
  }
}

const app = new App()
app.init().catch(console.error)
