/**
 * RaindropRenderer - WebGPU-based raindrop on glass effect
 *
 * This renderer creates a realistic simulation of raindrops on a window.
 * The effect is entirely GPU-based using a single fragment shader that:
 *
 * 1. GRID-BASED DROPS: Divides the screen into cells, each containing one drop.
 *    Random offsets prevent visible grid patterns.
 *
 * 2. MULTI-LAYER DEPTH: Two falling drop layers at different scales create
 *    the illusion of drops at varying distances from the glass.
 *
 * 3. REFRACTION: Each drop acts as a lens, bending light to distort the
 *    background image. This is computed by sampling the drop field at
 *    offset positions to estimate surface normals.
 *
 * 4. MIPMAP BLUR: Background blur uses GPU mipmaps - lower resolution mip
 *    levels naturally produce a blurred result, much faster than multi-tap
 *    blur filters.
 *
 * 5. LIGHTING: Rim lights on drop edges and specular highlights create
 *    the 3D dome appearance of water drops.
 */

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
  wiperEnabled: boolean
  wiperBrushSize: number
  wiperFadeSpeed: number
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

  // Wipe mask for glass cleaning effect
  private wipeMaskTexture!: GPUTexture
  private wipeMaskSize = 512
  private wipeComputePipeline!: GPUComputePipeline
  private wipeFadeComputePipeline!: GPUComputePipeline
  private wipeBindGroupLayout!: GPUBindGroupLayout
  private wipeFadeBindGroupLayout!: GPUBindGroupLayout
  private wipeParamsBuffer!: GPUBuffer
  private fadeParamsBuffer!: GPUBuffer

  // Mouse state for wiping
  private mouseX: number = 0
  private mouseY: number = 0
  private mousePressed: boolean = false
  private lastMouseX: number = 0
  private lastMouseY: number = 0

  private width: number = 0
  private height: number = 0
  private time: number = 0
  // Accumulated drop time - prevents jumps when speed changes
  private dropTime: number = 0
  // Random seed ensures bokeh lights vary between page loads
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
    this.createWipeMask()
    this.createWipeComputePipeline()
    this.createPipeline()
    this.setupMouseHandlers()
  }

  /**
   * Creates GPU buffers for the fullscreen quad and uniform data.
   * The quad covers the entire screen (-1 to 1 in clip space).
   */
  private createBuffers() {
    // Fullscreen quad: 4 vertices for triangle strip
    // Each vertex: position (x,y) + texcoord (u,v)
    const quadVertices = new Float32Array([
      -1, -1, 0, 1,  // bottom-left
       1, -1, 1, 1,  // bottom-right
      -1,  1, 0, 0,  // top-left
       1,  1, 1, 0,  // top-right
    ])

    this.quadVertexBuffer = this.device.createBuffer({
      size: quadVertices.byteLength,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    })
    this.device.queue.writeBuffer(this.quadVertexBuffer, 0, quadVertices)

    // Uniform buffer for all shader parameters
    // 20 floats needed, rounded to 80 bytes (must be multiple of 16)
    this.uniformBuffer = this.device.createBuffer({
      size: 80,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    })
  }

  /**
   * Creates a linear sampler for smooth texture filtering.
   * Mipmaps are enabled for the blur effect.
   */
  private createSampler() {
    this.sampler = this.device.createSampler({
      magFilter: 'linear',
      minFilter: 'linear',
      mipmapFilter: 'linear',
      addressModeU: 'clamp-to-edge',
      addressModeV: 'clamp-to-edge',
    })
  }

  /**
   * Creates a 1x1 black texture as placeholder until a real background loads.
   * This prevents shader errors from null texture bindings.
   */
  private createPlaceholderTexture() {
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

  /**
   * Creates the wipe mask texture for tracking cleaned areas.
   * 0 = dirty/rainy, 1 = clean/wiped
   */
  private createWipeMask() {
    this.wipeMaskTexture = this.device.createTexture({
      size: [this.wipeMaskSize, this.wipeMaskSize],
      format: 'r32float',
      usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.STORAGE_BINDING,
    })
  }

  /**
   * Creates compute pipelines for painting and fading the wipe mask.
   */
  private createWipeComputePipeline() {
    // Compute shader to paint circles on the wipe mask
    const wipeShaderCode = `
      struct WipeParams {
        posX: f32,
        posY: f32,
        lastPosX: f32,
        lastPosY: f32,
        brushSize: f32,
        painting: f32,
      }
      @group(0) @binding(0) var wipeMask: texture_storage_2d<r32float, read_write>;
      @group(0) @binding(1) var<uniform> params: WipeParams;

      @compute @workgroup_size(8, 8)
      fn main(@builtin(global_invocation_id) id: vec3<u32>) {
        let size = textureDimensions(wipeMask);
        if (id.x >= size.x || id.y >= size.y) {
          return;
        }
        if (params.painting < 0.5) {
          return;
        }

        let uv = vec2<f32>(f32(id.x) / f32(size.x), f32(id.y) / f32(size.y));
        let pos = vec2<f32>(params.posX, params.posY);
        let lastPos = vec2<f32>(params.lastPosX, params.lastPosY);

        // Paint along the line from lastPos to pos for smooth strokes
        let lineDir = pos - lastPos;
        let lineLen = length(lineDir);
        let steps = max(1.0, lineLen * 50.0);

        var minDist = 1000.0;
        for (var i = 0.0; i < steps; i = i + 1.0) {
          let t = i / steps;
          let samplePos = mix(lastPos, pos, t);
          let d = length(uv - samplePos);
          minDist = min(minDist, d);
        }

        let brushRadius = params.brushSize;
        let current = textureLoad(wipeMask, id.xy).r;
        let paint = smoothstep(brushRadius, brushRadius * 0.5, minDist);
        let newVal = max(current, paint);
        textureStore(wipeMask, id.xy, vec4<f32>(newVal, 0.0, 0.0, 1.0));
      }
    `

    // Compute shader to fade the wipe mask over time
    const fadeShaderCode = `
      struct FadeParams {
        fadeAmount: f32,
      }
      @group(0) @binding(0) var wipeMask: texture_storage_2d<r32float, read_write>;
      @group(0) @binding(1) var<uniform> params: FadeParams;

      @compute @workgroup_size(8, 8)
      fn main(@builtin(global_invocation_id) id: vec3<u32>) {
        let size = textureDimensions(wipeMask);
        if (id.x >= size.x || id.y >= size.y) {
          return;
        }

        let current = textureLoad(wipeMask, id.xy).r;
        let newVal = max(0.0, current - params.fadeAmount);
        textureStore(wipeMask, id.xy, vec4<f32>(newVal, 0.0, 0.0, 1.0));
      }
    `

    const wipeShader = this.device.createShaderModule({ code: wipeShaderCode })
    const fadeShader = this.device.createShaderModule({ code: fadeShaderCode })

    this.wipeBindGroupLayout = this.device.createBindGroupLayout({
      entries: [
        { binding: 0, visibility: GPUShaderStage.COMPUTE, storageTexture: { access: 'read-write', format: 'r32float' } },
        { binding: 1, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'uniform' } },
      ],
    })

    this.wipeFadeBindGroupLayout = this.device.createBindGroupLayout({
      entries: [
        { binding: 0, visibility: GPUShaderStage.COMPUTE, storageTexture: { access: 'read-write', format: 'r32float' } },
        { binding: 1, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'uniform' } },
      ],
    })

    this.wipeComputePipeline = this.device.createComputePipeline({
      layout: this.device.createPipelineLayout({ bindGroupLayouts: [this.wipeBindGroupLayout] }),
      compute: { module: wipeShader, entryPoint: 'main' },
    })

    this.wipeFadeComputePipeline = this.device.createComputePipeline({
      layout: this.device.createPipelineLayout({ bindGroupLayouts: [this.wipeFadeBindGroupLayout] }),
      compute: { module: fadeShader, entryPoint: 'main' },
    })

    // Pre-create buffers for wipe parameters (reused each frame)
    this.wipeParamsBuffer = this.device.createBuffer({
      size: 32,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    })
    this.fadeParamsBuffer = this.device.createBuffer({
      size: 16,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    })
  }

  /**
   * Sets up mouse/pointer event handlers for the wiper feature.
   */
  private setupMouseHandlers() {
    const getPos = (e: PointerEvent) => {
      const rect = this.canvas.getBoundingClientRect()
      return {
        x: (e.clientX - rect.left) / rect.width,
        y: (e.clientY - rect.top) / rect.height,
      }
    }

    this.canvas.addEventListener('pointerdown', (e) => {
      const pos = getPos(e)
      this.mouseX = pos.x
      this.mouseY = pos.y
      this.lastMouseX = pos.x
      this.lastMouseY = pos.y
      this.mousePressed = true
      this.canvas.setPointerCapture(e.pointerId)
    })

    this.canvas.addEventListener('pointermove', (e) => {
      if (this.mousePressed) {
        this.lastMouseX = this.mouseX
        this.lastMouseY = this.mouseY
        const pos = getPos(e)
        this.mouseX = pos.x
        this.mouseY = pos.y
      }
    })

    this.canvas.addEventListener('pointerup', () => {
      this.mousePressed = false
    })

    this.canvas.addEventListener('pointerleave', () => {
      this.mousePressed = false
    })
  }

  /**
   * Creates the render pipeline with vertex and fragment shaders.
   * The pipeline uses a simple fullscreen quad approach - all the
   * interesting work happens in the fragment shader.
   */
  private createPipeline() {
    const shaderModule = this.device.createShaderModule({ code: raindropShader })

    this.bindGroupLayout = this.device.createBindGroupLayout({
      entries: [
        { binding: 0, visibility: GPUShaderStage.FRAGMENT, buffer: { type: 'uniform' } },
        { binding: 1, visibility: GPUShaderStage.FRAGMENT, sampler: { type: 'filtering' } },
        { binding: 2, visibility: GPUShaderStage.FRAGMENT, texture: { sampleType: 'float' } },
        { binding: 3, visibility: GPUShaderStage.FRAGMENT, texture: { sampleType: 'unfilterable-float' } },
      ],
    })

    this.updateBindGroup()

    this.pipeline = this.device.createRenderPipeline({
      layout: this.device.createPipelineLayout({ bindGroupLayouts: [this.bindGroupLayout] }),
      vertex: {
        module: shaderModule,
        entryPoint: 'vertexMain',
        buffers: [{
          arrayStride: 16,  // 4 floats * 4 bytes
          attributes: [
            { shaderLocation: 0, offset: 0, format: 'float32x2' },  // position
            { shaderLocation: 1, offset: 8, format: 'float32x2' },  // texcoord
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
        { binding: 3, resource: this.wipeMaskTexture.createView() },
      ],
    })
  }

  /**
   * Loads a background image and generates mipmaps for blur effect.
   * Pass null to use the procedural bokeh background instead.
   */
  async setBackground(imagePath: string | null) {
    if (imagePath === null) {
      this.useTextureBackground = false
      return
    }

    try {
      const response = await fetch(imagePath)
      const blob = await response.blob()
      const imageBitmap = await createImageBitmap(blob)

      if (this.backgroundTexture && this.backgroundTexture.width > 1) {
        this.backgroundTexture.destroy()
      }

      // Calculate mip levels: log2 of largest dimension
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

      // Generate mipmaps for blur effect
      await this.generateMipmaps(this.backgroundTexture, imageBitmap.width, imageBitmap.height)

      this.useTextureBackground = true
      this.updateBindGroup()
    } catch (error) {
      console.error('Failed to load background image:', error)
    }
  }

  /**
   * Generates mipmaps using a compute shader.
   * Each mip level is half the resolution of the previous, creating
   * progressively blurrier versions of the image. The fragment shader
   * samples different mip levels based on desired blur amount.
   */
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

    // Generate each mip level by downsampling the previous level
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

  /**
   * Handles canvas resize with device pixel ratio support for sharp rendering.
   */
  resize(width: number, height: number) {
    const dpr = window.devicePixelRatio || 1
    this.width = Math.floor(width * dpr)
    this.height = Math.floor(height * dpr)
    this.canvas.width = this.width
    this.canvas.height = this.height
    this.canvas.style.width = `${width}px`
    this.canvas.style.height = `${height}px`
  }

  /**
   * Updates uniform buffer with current time and all effect parameters.
   * Called every frame before render().
   */
  update(deltaTime: number, time: number, params: RaindropParams) {
    this.time = time
    // Accumulate drop time based on current speed - prevents jumps when speed changes
    this.dropTime += deltaTime * params.dropSpeed

    // Update wipe mask (paint and fade)
    if (params.wiperEnabled) {
      this.updateWipeMask(deltaTime, params)
    }

    const uniforms = new Float32Array([
      this.time,                              // 0: animation time
      this.width,                             // 1: canvas width in pixels
      this.height,                            // 2: canvas height in pixels
      params.rainAmount,                      // 3: overall rain intensity
      this.dropTime,                          // 4: accumulated drop time (was dropSpeed)
      params.sawProbability,                  // 5: chance of stick-slide vs linear motion
      params.dropSize,                        // 6: (unused currently)
      params.minBlur,                         // 7: blur amount on drops
      params.maxBlur,                         // 8: blur amount on background
      params.refractionStrength,              // 9: how much drops distort background
      params.rimLightIntensity,               // 10: edge highlight brightness
      params.specularIntensity,               // 11: specular highlight brightness
      params.specularPower,                   // 12: specular highlight sharpness
      params.lightningEnabled ? 1.0 : 0.0,    // 13: lightning flashes toggle
      params.lightningIntensity,              // 14: lightning brightness
      this.useTextureBackground ? 1.0 : 0.0,  // 15: texture vs procedural background
      this.randomSeed,                        // 16: seed for procedural bokeh
      params.wiperEnabled ? 1.0 : 0.0,        // 17: wiper enabled flag
      0, 0                                    // 18-19: padding to 80 bytes
    ])
    this.device.queue.writeBuffer(this.uniformBuffer, 0, uniforms)
  }

  /**
   * Updates the wipe mask texture - paints where mouse drags and fades over time.
   */
  private updateWipeMask(deltaTime: number, params: RaindropParams) {
    const commandEncoder = this.device.createCommandEncoder()

    // Paint circles where mouse is dragged
    const wipeParams = new Float32Array([
      this.mouseX,
      this.mouseY,
      this.lastMouseX,
      this.lastMouseY,
      params.wiperBrushSize,
      this.mousePressed ? 1.0 : 0.0,
      0, 0,
    ])
    this.device.queue.writeBuffer(this.wipeParamsBuffer, 0, wipeParams)

    const wipeBindGroup = this.device.createBindGroup({
      layout: this.wipeBindGroupLayout,
      entries: [
        { binding: 0, resource: this.wipeMaskTexture.createView() },
        { binding: 1, resource: { buffer: this.wipeParamsBuffer } },
      ],
    })

    const wipePass = commandEncoder.beginComputePass()
    wipePass.setPipeline(this.wipeComputePipeline)
    wipePass.setBindGroup(0, wipeBindGroup)
    wipePass.dispatchWorkgroups(
      Math.ceil(this.wipeMaskSize / 8),
      Math.ceil(this.wipeMaskSize / 8)
    )
    wipePass.end()

    // Fade the mask over time
    const fadeAmount = deltaTime * params.wiperFadeSpeed
    this.device.queue.writeBuffer(this.fadeParamsBuffer, 0, new Float32Array([fadeAmount, 0, 0, 0]))

    const fadeBindGroup = this.device.createBindGroup({
      layout: this.wipeFadeBindGroupLayout,
      entries: [
        { binding: 0, resource: this.wipeMaskTexture.createView() },
        { binding: 1, resource: { buffer: this.fadeParamsBuffer } },
      ],
    })

    const fadePass = commandEncoder.beginComputePass()
    fadePass.setPipeline(this.wipeFadeComputePipeline)
    fadePass.setBindGroup(0, fadeBindGroup)
    fadePass.dispatchWorkgroups(
      Math.ceil(this.wipeMaskSize / 8),
      Math.ceil(this.wipeMaskSize / 8)
    )
    fadePass.end()

    this.device.queue.submit([commandEncoder.finish()])

    // Reset last position to current after painting
    if (this.mousePressed) {
      this.lastMouseX = this.mouseX
      this.lastMouseY = this.mouseY
    }
  }

  /**
   * Renders a single frame by drawing the fullscreen quad.
   * The fragment shader does all the raindrop computation per-pixel.
   */
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
    pass.draw(4)  // 4 vertices for triangle strip
    pass.end()

    this.device.queue.submit([commandEncoder.finish()])
  }
}
