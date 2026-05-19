import { Mat4, Vec3 } from '../math/Math'

export class Camera {
  position: Vec3 = [0, 0, 5]
  target: Vec3 = [0, 0, 0]
  up: Vec3 = [0, 1, 0]

  fov = Math.PI / 4
  aspect: number
  near = 0.1
  far = 100

  private viewMatrix: Mat4 = Mat4.identity()
  private projectionMatrix: Mat4 = Mat4.identity()
  private viewProjectionMatrix: Mat4 = Mat4.identity()

  uniformBuffer: GPUBuffer | null = null
  bindGroup: GPUBindGroup | null = null
  bindGroupLayout: GPUBindGroupLayout | null = null

  constructor(aspect: number) {
    this.aspect = aspect
    this.updateProjectionMatrix()
    this.updateViewMatrix()
  }

  updateViewMatrix() {
    this.viewMatrix = Mat4.lookAt(this.position, this.target, this.up)
    this.updateViewProjectionMatrix()
  }

  updateProjectionMatrix() {
    this.projectionMatrix = Mat4.perspective(this.fov, this.aspect, this.near, this.far)
    this.updateViewProjectionMatrix()
  }

  private updateViewProjectionMatrix() {
    this.viewProjectionMatrix = Mat4.multiply(this.projectionMatrix, this.viewMatrix)
  }

  initGPUResources(device: GPUDevice) {
    this.uniformBuffer = device.createBuffer({
      size: 64,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    })

    this.bindGroupLayout = device.createBindGroupLayout({
      entries: [
        {
          binding: 0,
          visibility: GPUShaderStage.VERTEX,
          buffer: { type: 'uniform' },
        },
      ],
    })

    this.bindGroup = device.createBindGroup({
      layout: this.bindGroupLayout,
      entries: [
        {
          binding: 0,
          resource: { buffer: this.uniformBuffer },
        },
      ],
    })
  }

  updateUniformBuffer(device: GPUDevice) {
    if (!this.uniformBuffer) {
      this.initGPUResources(device)
    }
    device.queue.writeBuffer(this.uniformBuffer!, 0, new Float32Array(this.viewProjectionMatrix))
  }

  getBindGroupLayout(): GPUBindGroupLayout {
    return this.bindGroupLayout!
  }
}
