import './style.css'
import GUI from 'lil-gui'
import { RaindropRenderer, RaindropParams } from './raindrop/RaindropRenderer'

interface AppParams extends RaindropParams {
  soundEnabled: boolean
  rainVolume: number
  thunderVolume: number
}

class App {
  private renderer!: RaindropRenderer
  private lastTime = 0
  private accumulatedTime = 0
  private gui!: GUI
  private controls = {
    paused: false
  }

  // Audio
  private audioContext: AudioContext | null = null
  private rainAudio: HTMLAudioElement | null = null
  private thunderBuffer: AudioBuffer | null = null
  private masterGain: GainNode | null = null
  private lastLightningValue = 0
  private lightningThreshold = 0.3
  private soundButton: HTMLButtonElement | null = null

  private params: AppParams = {
    background: 'Diagon Alley',
    rainAmount: 0.8,
    dropSpeed: 0.75,
    sawProbability: 0.4,
    dropSize: 1.0,
    minBlur: 2.0,
    maxBlur: 6.0,
    refractionStrength: 0.3,
    rimLightIntensity: 0.08,
    specularIntensity: 0.15,
    specularPower: 20.0,
    lightningEnabled: true,
    lightningIntensity: 0.3,
    wiperEnabled: true,
    wiperBrushSize: 0.08,
    wiperFadeSpeed: 0.15,
    soundEnabled: false,
    rainVolume: 0.5,
    thunderVolume: 0.5,
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
    this.setupSoundButton()
    this.start()
  }

  private async initAudio() {
    if (this.audioContext) return // Already initialized

    this.rainAudio = new Audio(`${import.meta.env.BASE_URL}sound/rain.mp3`)
    this.rainAudio.loop = true
    this.rainAudio.volume = this.params.rainVolume

    this.audioContext = new AudioContext()
    this.masterGain = this.audioContext.createGain()
    this.masterGain.connect(this.audioContext.destination)

    try {
      const response = await fetch(`${import.meta.env.BASE_URL}sound/thunder.mp3`)
      const arrayBuffer = await response.arrayBuffer()
      this.thunderBuffer = await this.audioContext.decodeAudioData(arrayBuffer)
    } catch (e) {
      console.warn('Failed to load thunder sound:', e)
    }
  }

  private volumeOnIcon = `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="currentColor"><path d="M560-131v-82q90-26 145-100t55-168q0-94-55-168T560-749v-82q124 28 202 125.5T840-481q0 127-78 224.5T560-131ZM120-360v-240h160l200-200v640L280-360H120Zm440 40v-322q47 22 73.5 66t26.5 96q0 51-26.5 94.5T560-320ZM400-606l-86 86H200v80h114l86 86v-252ZM300-480Z"/></svg>`
  private volumeOffIcon = `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="currentColor"><path d="M792-56 671-177q-25 16-53 27.5T560-131v-82q14-5 27.5-10t25.5-12L480-368v208L280-360H120v-240h128L56-792l56-56 736 736-56 56Zm-8-232-58-58q17-31 25.5-65t8.5-70q0-94-55-168T560-749v-82q124 28 202 125.5T840-481q0 53-14.5 102T784-288ZM650-422l-90-90v-130q47 22 73.5 66t26.5 96q0 15-2.5 29.5T650-422ZM480-592 376-696l104-104v208Zm-80 238v-94l-72-72H200v80h114l86 86Zm-36-130Z"/></svg>`

  private setupSoundButton() {
    this.soundButton = document.createElement('button')
    this.soundButton.id = 'sound-toggle'
    this.soundButton.innerHTML = this.params.soundEnabled ? this.volumeOnIcon : this.volumeOffIcon
    this.soundButton.title = 'Toggle sound'
    document.body.appendChild(this.soundButton)

    this.soundButton.addEventListener('click', async () => {
      await this.initAudio()
      this.toggleSound()
    })
  }

  private toggleSound() {
    this.params.soundEnabled = !this.params.soundEnabled
    this.updateSoundState()
  }

  private updateSoundState() {
    if (this.soundButton) {
      this.soundButton.innerHTML = this.params.soundEnabled ? this.volumeOnIcon : this.volumeOffIcon
    }
    if (this.params.soundEnabled) {
      this.rainAudio?.play().catch(() => {})
      if (this.masterGain) {
        this.masterGain.gain.value = 1.0
      }
    } else {
      this.rainAudio?.pause()
      // Immediately silence all thunder sounds
      if (this.masterGain) {
        this.masterGain.gain.value = 0
      }
    }
  }

  private playThunder() {
    if (!this.audioContext || !this.thunderBuffer || !this.masterGain || !this.params.soundEnabled) return

    const source = this.audioContext.createBufferSource()
    const gainNode = this.audioContext.createGain()

    source.buffer = this.thunderBuffer
    gainNode.gain.value = this.params.thunderVolume

    source.connect(gainNode)
    gainNode.connect(this.masterGain)
    source.start()
  }

  private calculateLightningIntensity(time: number): number {
    const lt = time * 0.5
    let lightning = Math.sin(lt * Math.sin(lt * 10.0))
    lightning *= Math.pow(Math.max(0.0, Math.sin(lt + Math.sin(lt))), 10.0)
    return lightning
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
    rainFolder.add(this.params, 'rainAmount', 0, 2, 0.01).name('Amount')
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

    const wiperFolder = this.gui.addFolder('Wiper')
    wiperFolder.add(this.params, 'wiperEnabled').name('Enabled')
    wiperFolder.add(this.params, 'wiperBrushSize', 0.02, 0.2, 0.01).name('Brush Size')
    wiperFolder.add(this.params, 'wiperFadeSpeed', 0.05, 0.5, 0.01).name('Fade Speed')

    const soundFolder = this.gui.addFolder('Sound')
    soundFolder.add(this.params, 'rainVolume', 0, 1, 0.05).name('Rain Volume').onChange((value: number) => {
      if (this.rainAudio) this.rainAudio.volume = value
    })
    soundFolder.add(this.params, 'thunderVolume', 0, 1, 0.05).name('Thunder Volume')

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

    // Check for lightning flash and play thunder
    if (this.params.lightningEnabled && this.params.soundEnabled) {
      const lightningValue = this.calculateLightningIntensity(this.accumulatedTime)
      if (lightningValue > this.lightningThreshold && this.lastLightningValue <= this.lightningThreshold) {
        this.playThunder()
      }
      this.lastLightningValue = lightningValue
    }

    this.renderer.update(deltaTime, this.accumulatedTime, this.params)
    this.renderer.render()

    requestAnimationFrame(this.loop.bind(this))
  }
}

const app = new App()
app.init().catch(console.error)
