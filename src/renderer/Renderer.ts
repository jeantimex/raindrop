import { Scene } from '../scene/Scene'
import { Camera } from '../camera/Camera'

export class Renderer {
  private canvas: HTMLCanvasElement
  private context!: GPUCanvasContext
  private _device!: GPUDevice
  private format!: GPUTextureFormat
  private depthTexture!: GPUTexture

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
  }

  get device(): GPUDevice {
    return this._device
  }

  async init() {
    if (!navigator.gpu) {
      throw new Error('WebGPU not supported')
    }

    const adapter = await navigator.gpu.requestAdapter()
    if (!adapter) {
      throw new Error('No GPU adapter found')
    }

    this._device = await adapter.requestDevice()

    this.context = this.canvas.getContext('webgpu')!
    this.format = navigator.gpu.getPreferredCanvasFormat()

    this.context.configure({
      device: this._device,
      format: this.format,
      alphaMode: 'premultiplied',
    })

    this.createDepthTexture()
  }

  private createDepthTexture() {
    if (this.depthTexture) {
      this.depthTexture.destroy()
    }

    this.depthTexture = this._device.createTexture({
      size: [this.canvas.width, this.canvas.height],
      format: 'depth24plus',
      usage: GPUTextureUsage.RENDER_ATTACHMENT,
    })
  }

  resize(width: number, height: number) {
    const dpr = window.devicePixelRatio || 1
    this.canvas.width = width * dpr
    this.canvas.height = height * dpr
    this.canvas.style.width = `${width}px`
    this.canvas.style.height = `${height}px`
    this.createDepthTexture()
  }

  render(scene: Scene, camera: Camera) {
    camera.updateUniformBuffer(this._device)

    const commandEncoder = this._device.createCommandEncoder()

    const renderPassDescriptor: GPURenderPassDescriptor = {
      colorAttachments: [
        {
          view: this.context.getCurrentTexture().createView(),
          clearValue: { r: 0.05, g: 0.05, b: 0.1, a: 1.0 },
          loadOp: 'clear',
          storeOp: 'store',
        },
      ],
      depthStencilAttachment: {
        view: this.depthTexture.createView(),
        depthClearValue: 1.0,
        depthLoadOp: 'clear',
        depthStoreOp: 'store',
      },
    }

    const passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor)

    for (const mesh of scene.meshes) {
      passEncoder.setPipeline(mesh.pipeline)
      passEncoder.setBindGroup(0, camera.bindGroup!)
      passEncoder.setBindGroup(1, mesh.bindGroup)
      passEncoder.setVertexBuffer(0, mesh.vertexBuffer)
      passEncoder.setIndexBuffer(mesh.indexBuffer, 'uint16')
      passEncoder.drawIndexed(mesh.indexCount)
    }

    passEncoder.end()
    this._device.queue.submit([commandEncoder.finish()])
  }

  getFormat(): GPUTextureFormat {
    return this.format
  }
}
