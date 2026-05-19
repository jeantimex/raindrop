import raindropShader from '../shaders/raindrop.wgsl?raw'

export interface RaindropParams {
  background: string
  rainAmount: number
  dropSpeed: number
  sawProbability: number
  dropSize: number
  minBlur: number
  maxBlur: number
  refractionStrength: number
  rimLightIntensity: number
  specularIntensity: number
  specularPower: number
  lightningEnabled: boolean
  lightningIntensity: number
}

export class RaindropRenderer {
  private canvas: HTMLCanvasElement
  private device!: GPUDevice
  private context!: GPUCanvasContext
  private format!: GPUTextureFormat

  private pipeline!: GPURenderPipeline
  private uniformBuffer!: GPUBuffer
  private quadVertexBuffer!: GPUBuffer
  private bindGroup!: GPUBindGroup
  private bindGroupLayout!: GPUBindGroupLayout

  private sampler!: GPUSampler
  private backgroundTexture: GPUTexture | null = null
  private useTextureBackground: boolean = false

  private width: number = 0
  private height: number = 0
  private time: number = 0
  private randomSeed: number = Math.random() * 1000

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
  }

  async init() {
    if (!navigator.gpu) {
      throw new Error('WebGPU not supported')
    }

    const adapter = await navigator.gpu.requestAdapter()
    if (!adapter) {
      throw new Error('No GPU adapter found')
    }

    this.device = await adapter.requestDevice()
    this.context = this.canvas.getContext('webgpu')!
    this.format = navigator.gpu.getPreferredCanvasFormat()

    this.context.configure({
      device: this.device,
      format: this.format,
      alphaMode: 'premultiplied',
    })

    this.createBuffers()
    this.createSampler()
    this.createPlaceholderTexture()
    this.createPipeline()
  }

  private createBuffers() {
    const quadVertices = new Float32Array([
      -1, -1, 0, 1,
       1, -1, 1, 1,
      -1,  1, 0, 0,
       1,  1, 1, 0,
    ])

    this.quadVertexBuffer = this.device.createBuffer({
      size: quadVertices.byteLength,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    })
    this.device.queue.writeBuffer(this.quadVertexBuffer, 0, quadVertices)

    // 20 floats needed, round up to 80 bytes (multiple of 16)
    this.uniformBuffer = this.device.createBuffer({
      size: 80,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    })
  }

  private createSampler() {
    this.sampler = this.device.createSampler({
      magFilter: 'linear',
      minFilter: 'linear',
      mipmapFilter: 'linear',
      addressModeU: 'clamp-to-edge',
      addressModeV: 'clamp-to-edge',
    })
  }

  private createPlaceholderTexture() {
    // 1x1 placeholder texture
    this.backgroundTexture = this.device.createTexture({
      size: [1, 1],
      format: 'rgba8unorm',
      usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST,
    })
    this.device.queue.writeTexture(
      { texture: this.backgroundTexture },
      new Uint8Array([0, 0, 0, 255]),
      { bytesPerRow: 4 },
      [1, 1]
    )
  }

  private createPipeline() {
    const shaderModule = this.device.createShaderModule({ code: raindropShader })

    this.bindGroupLayout = this.device.createBindGroupLayout({
      entries: [
        { binding: 0, visibility: GPUShaderStage.FRAGMENT, buffer: { type: 'uniform' } },
        { binding: 1, visibility: GPUShaderStage.FRAGMENT, sampler: { type: 'filtering' } },
        { binding: 2, visibility: GPUShaderStage.FRAGMENT, texture: { sampleType: 'float' } },
      ],
    })

    this.updateBindGroup()

    this.pipeline = this.device.createRenderPipeline({
      layout: this.device.createPipelineLayout({ bindGroupLayouts: [this.bindGroupLayout] }),
      vertex: {
        module: shaderModule,
        entryPoint: 'vertexMain',
        buffers: [{
          arrayStride: 16,
          attributes: [
            { shaderLocation: 0, offset: 0, format: 'float32x2' },
            { shaderLocation: 1, offset: 8, format: 'float32x2' },
          ],
        }],
      },
      fragment: {
        module: shaderModule,
        entryPoint: 'fragmentMain',
        targets: [{ format: this.format }],
      },
      primitive: { topology: 'triangle-strip' },
    })
  }

  private updateBindGroup() {
    this.bindGroup = this.device.createBindGroup({
      layout: this.bindGroupLayout,
      entries: [
        { binding: 0, resource: { buffer: this.uniformBuffer } },
        { binding: 1, resource: this.sampler },
        { binding: 2, resource: this.backgroundTexture!.createView() },
      ],
    })
  }

  async setBackground(imagePath: string | null) {
    if (imagePath === null) {
      // Use procedural background
      this.useTextureBackground = false
      return
    }

    try {
      const response = await fetch(imagePath)
      const blob = await response.blob()
      const imageBitmap = await createImageBitmap(blob)

      // Destroy old texture if it exists and is not the placeholder
      if (this.backgroundTexture && this.backgroundTexture.width > 1) {
        this.backgroundTexture.destroy()
      }

      // Calculate mip levels
      const mipLevelCount = Math.floor(Math.log2(Math.max(imageBitmap.width, imageBitmap.height))) + 1

      this.backgroundTexture = this.device.createTexture({
        size: [imageBitmap.width, imageBitmap.height],
        format: 'rgba8unorm',
        mipLevelCount,
        usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.STORAGE_BINDING,
      })

      this.device.queue.copyExternalImageToTexture(
        { source: imageBitmap },
        { texture: this.backgroundTexture },
        [imageBitmap.width, imageBitmap.height]
      )

      // Generate mipmaps
      await this.generateMipmaps(this.backgroundTexture, imageBitmap.width, imageBitmap.height)

      this.useTextureBackground = true
      this.updateBindGroup()
    } catch (error) {
      console.error('Failed to load background image:', error)
    }
  }

  private async generateMipmaps(texture: GPUTexture, width: number, height: number) {
    const mipmapShaderCode = `
      @group(0) @binding(0) var inputTex: texture_2d<f32>;
      @group(0) @binding(1) var outputTex: texture_storage_2d<rgba8unorm, write>;
      @group(0) @binding(2) var texSampler: sampler;

      @compute @workgroup_size(8, 8)
      fn main(@builtin(global_invocation_id) id: vec3<u32>) {
        let outputSize = textureDimensions(outputTex);
        if (id.x >= outputSize.x || id.y >= outputSize.y) {
          return;
        }
        let uv = (vec2<f32>(id.xy) + 0.5) / vec2<f32>(outputSize);
        let color = textureSampleLevel(inputTex, texSampler, uv, 0.0);
        textureStore(outputTex, id.xy, color);
      }
    `

    const mipmapShader = this.device.createShaderModule({ code: mipmapShaderCode })

    const mipmapPipeline = this.device.createComputePipeline({
      layout: 'auto',
      compute: {
        module: mipmapShader,
        entryPoint: 'main',
      },
    })

    const sampler = this.device.createSampler({
      magFilter: 'linear',
      minFilter: 'linear',
    })

    let mipWidth = width
    let mipHeight = height
    let mipLevel = 0

    while (mipWidth > 1 || mipHeight > 1) {
      const nextWidth = Math.max(1, Math.floor(mipWidth / 2))
      const nextHeight = Math.max(1, Math.floor(mipHeight / 2))

      const bindGroup = this.device.createBindGroup({
        layout: mipmapPipeline.getBindGroupLayout(0),
        entries: [
          { binding: 0, resource: texture.createView({ baseMipLevel: mipLevel, mipLevelCount: 1 }) },
          { binding: 1, resource: texture.createView({ baseMipLevel: mipLevel + 1, mipLevelCount: 1 }) },
          { binding: 2, resource: sampler },
        ],
      })

      const commandEncoder = this.device.createCommandEncoder()
      const pass = commandEncoder.beginComputePass()
      pass.setPipeline(mipmapPipeline)
      pass.setBindGroup(0, bindGroup)
      pass.dispatchWorkgroups(Math.ceil(nextWidth / 8), Math.ceil(nextHeight / 8))
      pass.end()
      this.device.queue.submit([commandEncoder.finish()])

      mipWidth = nextWidth
      mipHeight = nextHeight
      mipLevel++
    }
  }

  resize(width: number, height: number) {
    const dpr = window.devicePixelRatio || 1
    this.width = Math.floor(width * dpr)
    this.height = Math.floor(height * dpr)
    this.canvas.width = this.width
    this.canvas.height = this.height
    this.canvas.style.width = `${width}px`
    this.canvas.style.height = `${height}px`
  }

  update(_deltaTime: number, time: number, params: RaindropParams) {
    this.time = time

    const uniforms = new Float32Array([
      this.time,                              // 0
      this.width,                             // 1
      this.height,                            // 2
      params.rainAmount,                      // 3
      params.dropSpeed,                       // 4
      params.sawProbability,                  // 5
      params.dropSize,                        // 6
      params.minBlur,                         // 7
      params.maxBlur,                         // 8
      params.refractionStrength,              // 9
      params.rimLightIntensity,               // 10
      params.specularIntensity,               // 11
      params.specularPower,                   // 12
      params.lightningEnabled ? 1.0 : 0.0,    // 13
      params.lightningIntensity,              // 14
      this.useTextureBackground ? 1.0 : 0.0,  // 15
      this.randomSeed,                        // 16
      0, 0, 0                                 // padding to 20 floats
    ])
    this.device.queue.writeBuffer(this.uniformBuffer, 0, uniforms)
  }

  render() {
    const commandEncoder = this.device.createCommandEncoder()

    const pass = commandEncoder.beginRenderPass({
      colorAttachments: [{
        view: this.context.getCurrentTexture().createView(),
        clearValue: { r: 0, g: 0, b: 0, a: 1 },
        loadOp: 'clear',
        storeOp: 'store',
      }],
    })

    pass.setPipeline(this.pipeline)
    pass.setBindGroup(0, this.bindGroup)
    pass.setVertexBuffer(0, this.quadVertexBuffer)
    pass.draw(4)
    pass.end()

    this.device.queue.submit([commandEncoder.finish()])
  }
}
