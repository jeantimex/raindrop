import { Mesh } from './Mesh'
import shaderSource from '../shaders/basic.wgsl?raw'

export class CubeMesh extends Mesh {
  constructor(device: GPUDevice) {
    super(device)
    this.createGeometry()
    this.createUniformBuffer()
    this.createPipeline(device, this.createCameraBindGroupLayout(device), navigator.gpu.getPreferredCanvasFormat())
  }

  private createCameraBindGroupLayout(device: GPUDevice): GPUBindGroupLayout {
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

  private createGeometry() {
    const vertices = new Float32Array([
      // Front face
      -1, -1,  1,   1, 0, 0,
       1, -1,  1,   0, 1, 0,
       1,  1,  1,   0, 0, 1,
      -1,  1,  1,   1, 1, 0,
      // Back face
      -1, -1, -1,   1, 0, 1,
       1, -1, -1,   0, 1, 1,
       1,  1, -1,   1, 1, 1,
      -1,  1, -1,   0, 0, 0,
      // Top face
      -1,  1, -1,   1, 0, 0,
       1,  1, -1,   0, 1, 0,
       1,  1,  1,   0, 0, 1,
      -1,  1,  1,   1, 1, 0,
      // Bottom face
      -1, -1, -1,   1, 0, 1,
       1, -1, -1,   0, 1, 1,
       1, -1,  1,   1, 1, 1,
      -1, -1,  1,   0, 0, 0,
      // Right face
       1, -1, -1,   1, 0, 0,
       1,  1, -1,   0, 1, 0,
       1,  1,  1,   0, 0, 1,
       1, -1,  1,   1, 1, 0,
      // Left face
      -1, -1, -1,   1, 0, 1,
      -1,  1, -1,   0, 1, 1,
      -1,  1,  1,   1, 1, 1,
      -1, -1,  1,   0, 0, 0,
    ])

    const indices = new Uint16Array([
       0,  1,  2,   0,  2,  3,  // Front
       4,  6,  5,   4,  7,  6,  // Back
       8,  9, 10,   8, 10, 11,  // Top
      12, 14, 13,  12, 15, 14,  // Bottom
      16, 17, 18,  16, 18, 19,  // Right
      20, 22, 21,  20, 23, 22,  // Left
    ])

    this.indexCount = indices.length

    this.vertexBuffer = this.device.createBuffer({
      size: vertices.byteLength,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    })
    this.device.queue.writeBuffer(this.vertexBuffer, 0, vertices)

    this.indexBuffer = this.device.createBuffer({
      size: indices.byteLength,
      usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
    })
    this.device.queue.writeBuffer(this.indexBuffer, 0, indices)
  }

  private createUniformBuffer() {
    this.uniformBuffer = this.device.createBuffer({
      size: 64,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    })
  }

  createPipeline(
    device: GPUDevice,
    cameraBindGroupLayout: GPUBindGroupLayout,
    format: GPUTextureFormat
  ) {
    const shaderModule = device.createShaderModule({
      code: shaderSource,
    })

    this.bindGroupLayout = this.createBindGroupLayout(device)
    this.createBindGroup(device, this.bindGroupLayout)

    const pipelineLayout = device.createPipelineLayout({
      bindGroupLayouts: [cameraBindGroupLayout, this.bindGroupLayout],
    })

    this.pipeline = device.createRenderPipeline({
      layout: pipelineLayout,
      vertex: {
        module: shaderModule,
        entryPoint: 'vertexMain',
        buffers: [
          {
            arrayStride: 24,
            attributes: [
              { shaderLocation: 0, offset: 0, format: 'float32x3' },
              { shaderLocation: 1, offset: 12, format: 'float32x3' },
            ],
          },
        ],
      },
      fragment: {
        module: shaderModule,
        entryPoint: 'fragmentMain',
        targets: [{ format }],
      },
      primitive: {
        topology: 'triangle-list',
        cullMode: 'back',
      },
      depthStencil: {
        format: 'depth24plus',
        depthWriteEnabled: true,
        depthCompare: 'less',
      },
    })
  }
}
