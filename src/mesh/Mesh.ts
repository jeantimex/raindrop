import { Mat4, Vec3 } from '../math/Math'

export abstract class Mesh {
  protected device: GPUDevice

  position: Vec3 = [0, 0, 0]
  rotation: Vec3 = [0, 0, 0]
  scale: Vec3 = [1, 1, 1]

  protected modelMatrix: Mat4 = Mat4.identity()

  vertexBuffer!: GPUBuffer
  indexBuffer!: GPUBuffer
  uniformBuffer!: GPUBuffer
  pipeline!: GPURenderPipeline
  bindGroup!: GPUBindGroup
  bindGroupLayout!: GPUBindGroupLayout

  indexCount = 0

  constructor(device: GPUDevice) {
    this.device = device
  }

  protected updateModelMatrix() {
    const translation = Mat4.translation(this.position)
    const rotationX = Mat4.rotationX(this.rotation[0])
    const rotationY = Mat4.rotationY(this.rotation[1])
    const rotationZ = Mat4.rotationZ(this.rotation[2])
    const scaleMatrix = Mat4.scaling(this.scale)

    this.modelMatrix = Mat4.multiply(
      translation,
      Mat4.multiply(rotationZ, Mat4.multiply(rotationY, Mat4.multiply(rotationX, scaleMatrix)))
    )
  }

  update(_deltaTime: number, time: number) {
    this.rotation[1] = time * 0.5
    this.rotation[0] = time * 0.3
    this.updateModelMatrix()
    this.device.queue.writeBuffer(this.uniformBuffer, 0, new Float32Array(this.modelMatrix))
  }

  abstract createPipeline(
    device: GPUDevice,
    cameraBindGroupLayout: GPUBindGroupLayout,
    format: GPUTextureFormat
  ): void

  protected createBindGroupLayout(device: GPUDevice): GPUBindGroupLayout {
    return device.createBindGroupLayout({
      entries: [
        {
          binding: 0,
          visibility: GPUShaderStage.VERTEX,
          buffer: { type: 'uniform' },
        },
      ],
    })
  }

  protected createBindGroup(device: GPUDevice, layout: GPUBindGroupLayout) {
    this.bindGroup = device.createBindGroup({
      layout,
      entries: [
        {
          binding: 0,
          resource: { buffer: this.uniformBuffer },
        },
      ],
    })
  }
}
