import { Mesh } from '../mesh/Mesh'
import { CubeMesh } from '../mesh/CubeMesh'
import { Camera } from '../camera/Camera'

export class Scene {
  private device: GPUDevice
  private _meshes: Mesh[] = []

  constructor(device: GPUDevice) {
    this.device = device
  }

  get meshes(): Mesh[] {
    return this._meshes
  }

  async init() {
    const cube = new CubeMesh(this.device)
    this._meshes.push(cube)
  }

  addMesh(mesh: Mesh) {
    this._meshes.push(mesh)
  }

  removeMesh(mesh: Mesh) {
    const index = this._meshes.indexOf(mesh)
    if (index > -1) {
      this._meshes.splice(index, 1)
    }
  }

  update(deltaTime: number, time: number) {
    for (const mesh of this._meshes) {
      mesh.update(deltaTime, time)
    }
  }

  initPipelines(camera: Camera, format: GPUTextureFormat) {
    for (const mesh of this._meshes) {
      mesh.createPipeline(this.device, camera.getBindGroupLayout(), format)
    }
  }
}
