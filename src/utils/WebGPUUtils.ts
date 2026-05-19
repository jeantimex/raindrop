export async function checkWebGPUSupport(): Promise<boolean> {
  if (!navigator.gpu) {
    console.error('WebGPU is not supported in this browser')
    return false
  }

  const adapter = await navigator.gpu.requestAdapter()
  if (!adapter) {
    console.error('No GPU adapter found')
    return false
  }

  return true
}

export function createBuffer(
  device: GPUDevice,
  data: Float32Array | Uint16Array | Uint32Array,
  usage: GPUBufferUsageFlags
): GPUBuffer {
  const buffer = device.createBuffer({
    size: data.byteLength,
    usage: usage | GPUBufferUsage.COPY_DST,
    mappedAtCreation: true,
  })

  const dst = buffer.getMappedRange()
  if (data instanceof Float32Array) {
    new Float32Array(dst).set(data)
  } else if (data instanceof Uint16Array) {
    new Uint16Array(dst).set(data)
  } else {
    new Uint32Array(dst).set(data)
  }
  buffer.unmap()

  return buffer
}

export function loadShader(device: GPUDevice, code: string): GPUShaderModule {
  return device.createShaderModule({ code })
}
